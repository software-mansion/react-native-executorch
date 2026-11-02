import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createWhisperSpeechToText,
  type WhisperSttModel,
  type WhisperLanguage,
  type WhisperSpeechToText,
} from '../extensions/speech/tasks/whisperSpeechToText';
import {
  createQwen3AsrSpeechToText,
  type Qwen3AsrSttModel,
  type Qwen3AsrSpeechToText,
} from '../extensions/speech/tasks/qwen3AsrSpeechToText';

/**
 * React hook to load and run a Whisper speech-to-text (ASR) model.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets, tokenizer, and voice activity detector, tracking download
 * progress and load errors, and releasing native memory when the component
 * unmounts or the configuration changes.
 *
 * For imperative usage, see {@link createWhisperSpeechToText}.
 * @category Hooks
 * @param config The Whisper speech-to-text model configuration.
 * See {@link WhisperSttModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link WhisperSpeechToText} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link WhisperSpeechToText}
 */
export function useSpeechToText<L extends WhisperLanguage = WhisperLanguage>(
  config: WhisperSttModel<L>,
  options?: ResourceOptions
): {
  /** Whether the model is loaded and ready to transcribe. */
  isReady: boolean;
  /** The download or load error, if any. */
  error: Error | undefined;
  /** Download progress across every asset, in percent. */
  downloadProgress: number;
  /** The config with every remote URL resolved to a local path. */
  resource: WhisperSttModel<L> | undefined;

  // Offline transcription methods
  transcribe: WhisperSpeechToText<L>['transcribe'] | undefined;
  transcribeStop: WhisperSpeechToText<L>['transcribeStop'] | undefined;
  transcribeWorklet: WhisperSpeechToText<L>['transcribeWorklet'] | undefined;

  // Live-streaming transcription methods
  stream: WhisperSpeechToText<L>['stream'] | undefined;
  streamStop: WhisperSpeechToText<L>['streamStop'] | undefined;
  streamInsert: WhisperSpeechToText<L>['streamInsert'] | undefined;
};

/**
 * React hook to load and run a Qwen3-ASR speech-to-text model.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets, tokenizer, and voice activity detector, tracking download
 * progress and load errors, and releasing native memory when the component
 * unmounts or the configuration changes.
 *
 * For imperative usage, see {@link createQwen3AsrSpeechToText}.
 * @category Hooks
 * @param config The Qwen3-ASR model configuration. See {@link Qwen3AsrSttModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link Qwen3AsrSpeechToText} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link Qwen3AsrSpeechToText}
 */
export function useSpeechToText(
  config: Qwen3AsrSttModel,
  options?: ResourceOptions
): {
  /** Whether the model is loaded and ready to transcribe. */
  isReady: boolean;
  /** The download or load error, if any. */
  error: Error | undefined;
  /** Download progress across every asset, in percent. */
  downloadProgress: number;
  /** The config with every remote URL resolved to a local path. */
  resource: Qwen3AsrSttModel | undefined;

  // Offline transcription methods
  transcribe: Qwen3AsrSpeechToText['transcribe'] | undefined;
  transcribeStop: Qwen3AsrSpeechToText['transcribeStop'] | undefined;
  transcribeWorklet: Qwen3AsrSpeechToText['transcribeWorklet'] | undefined;

  // Live-streaming transcription methods
  stream: Qwen3AsrSpeechToText['stream'] | undefined;
  streamStop: Qwen3AsrSpeechToText['streamStop'] | undefined;
  streamInsert: Qwen3AsrSpeechToText['streamInsert'] | undefined;
};

/**
 * React hook to load and run either speech-to-text pipeline, for callers that
 * pick the model at runtime (e.g. from a list mixing Whisper and Qwen3-ASR).
 * @category Hooks
 * @param config A Whisper or Qwen3-ASR model configuration.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The runner of whichever pipeline `config` names, combined with
 * loading state and download progress.
 */
export function useSpeechToText<L extends WhisperLanguage = WhisperLanguage>(
  config: WhisperSttModel<L> | Qwen3AsrSttModel,
  options?: ResourceOptions
): {
  /** Whether the model is loaded and ready to transcribe. */
  isReady: boolean;
  /** The download or load error, if any. */
  error: Error | undefined;
  /** Download progress across every asset, in percent. */
  downloadProgress: number;
  /** The config with every remote URL resolved to a local path. */
  resource: WhisperSttModel<L> | Qwen3AsrSttModel | undefined;

  // Offline transcription methods
  transcribe: (WhisperSpeechToText<L> | Qwen3AsrSpeechToText)['transcribe'] | undefined;
  transcribeStop: (WhisperSpeechToText<L> | Qwen3AsrSpeechToText)['transcribeStop'] | undefined;
  transcribeWorklet:
    | (WhisperSpeechToText<L> | Qwen3AsrSpeechToText)['transcribeWorklet']
    | undefined;

  // Live-streaming transcription methods
  stream: (WhisperSpeechToText<L> | Qwen3AsrSpeechToText)['stream'] | undefined;
  streamStop: (WhisperSpeechToText<L> | Qwen3AsrSpeechToText)['streamStop'] | undefined;
  streamInsert: (WhisperSpeechToText<L> | Qwen3AsrSpeechToText)['streamInsert'] | undefined;
};

export function useSpeechToText<L extends WhisperLanguage = WhisperLanguage>(
  config: WhisperSttModel<L> | Qwen3AsrSttModel,
  options?: ResourceOptions
) {
  // Each config names the pipeline it belongs to; an untagged one is Whisper.
  const factory = (
    sttConfig: WhisperSttModel<L> | Qwen3AsrSttModel
  ): Promise<WhisperSpeechToText<L> | Qwen3AsrSpeechToText> =>
    sttConfig.name === 'qwen3-asr'
      ? createQwen3AsrSpeechToText(sttConfig)
      : createWhisperSpeechToText(sttConfig);

  // Resolves the model, the tokenizer and the nested VAD model in one pass,
  // with progress weighted across all three.
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(factory, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    transcribe: model?.transcribe,
    transcribeWorklet: model?.transcribeWorklet,
    transcribeStop: model?.transcribeStop,
    stream: model?.stream,
    streamInsert: model?.streamInsert,
    streamStop: model?.streamStop,
  };
}
