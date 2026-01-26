import { ResourceSource } from '../types/common';
import { RnExecutorchError } from '../errors/errorUtils';

/**
 * Props for the useVAD hook.
 */
export interface VADProps {
  /**
   * `ResourceSource` that specifies the location of the VAD model binary.
   */
  model: { modelSource: ResourceSource };

  /**
   * Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
   */
  preventLoad?: boolean;
}

/**
 * Represents a detected audio segment with start and end timestamps.
 */
export interface Segment {
  /**
   * Start time of the segment in seconds.
   */
  start: number;

  /**
   * End time of the segment in seconds.
   */
  end: number;
}

/**
 * React hook state and methods for managing a Voice Activity Detection (VAD) model instance.
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
}
