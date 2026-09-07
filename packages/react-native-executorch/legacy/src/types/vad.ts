import { ResourceSource } from '../types/common';
import { RnExecutorchError } from '../errors/errorUtils';

/**
 * Union of all built-in VAD model names.
 * @category Types
 */
export type VADModelName = 'fsmn-vad';

/**
 * Configuration for the VAD model.
 * @category Types
 * @property {VADModelName} modelName - Unique name identifying the model.
 * @property {ResourceSource} modelSource - The source of the VAD model binary.
 */
export interface VADConfig {
  modelName: VADModelName;
  modelSource: ResourceSource;
}

/**
 * Props for the useVAD hook.
 * @category Types
 * @property {object} model - An object containing the model configuration.
 * @property {VADModelName} model.modelName - Unique name identifying the model.
 * @property {ResourceSource} model.modelSource - The source of the VAD model binary.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 */
export interface VADProps {
  model: VADConfig;
  preventLoad?: boolean;
}

/**
 * Represents a detected audio segment with start and end timestamps.
 * @category Types
 * @property {number} start - Start time of the segment in seconds.
 * @property {number} end - End time of the segment in seconds.
 */
export interface Segment {
  start: number;
  end: number;
}

/**
 * Configuration options for the VAD streaming process.
 * @category Types
 * @property {number} [timeout] - Specifies (in milliseconds) how much does streamer wait between model inferences.
 * @property {number} [detectionMargin] - Specifies (in milliseconds) how far the last detected speech segment can be to still be considered as ongoing speech.
 */
export interface VADStreamingOptions {
  timeout?: number;
  detectionMargin?: number;
}

/**
 * Input configuration for the VAD streaming hook.
 * @category Types
 * @property {() => void | Promise<void>} [onSpeechBegin] - Callback function triggered when speech is detected.
 * @property {() => void | Promise<void>} [onSpeechEnd] - Callback function triggered when speech end (silence is detected).
 * @property {VADStreamingOptions} [options] - Optional configuration for the streaming process.
 */
export interface VADStreamingInput {
  onSpeechBegin?: () => void | Promise<void>;
  onSpeechEnd?: () => void | Promise<void>;
  options?: VADStreamingOptions;
}

/**
 * React hook state and methods for managing a Voice Activity Detection (VAD) model instance.
 * @category Types
 */
export interface VADType {
  /**
   * Contains the error message if the VAD model failed to load or during processing.
   */
  error: null | RnExecutorchError;

  /**
   * Indicates whether the VAD model has successfully loaded and is ready for inference.
   */
  isReady: boolean;

  /**
   * Indicates whether the model is currently processing an inference.
   */
  isGenerating: boolean;

  /**
   * Represents the download progress as a value between 0 and 1.
   */
  downloadProgress: number;

  /**
   * Runs the Voice Activity Detection model on the provided audio waveform.
   * @param waveform - The input audio waveform array.
   * @returns A promise resolving to an array of detected audio segments (e.g., timestamps for speech).
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another request.
   */
  forward(waveform: Float32Array): Promise<Segment[]>;

  /**
   * Starts a streaming Voice Activity Detection session.
   * @param input - Configuration for streaming, including callbacks for speech begin/end and optional parameters.
   * @returns A promise that resolves when the streaming session stops.
   */
  stream(input: VADStreamingInput): Promise<void>;

  /**
   * Inserts an audio chunk into the streaming VAD session.
   * @param waveform - The audio data to add to the buffer.
   */
  streamInsert(waveform: Float32Array): void;

  /**
   * Stops the current streaming VAD session.
   */
  streamStop(): void;
}
