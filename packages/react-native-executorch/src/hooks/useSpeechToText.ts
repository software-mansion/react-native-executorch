import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createWhisperSpeechToText,
  type WhisperSttModel,
  type WhisperLanguage,
} from '../extensions/speech/tasks/whisperSpeechToText';

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
 * @param config The Whisper speech-to-text model configuration. See {@link
 * WhisperSttModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns An object containing the model's loading state, error, download
 * progress, and transcription functions.
 * @see {@link createWhisperSpeechToText}
 */
export function useSpeechToText<L extends WhisperLanguage = WhisperLanguage>(
  config: WhisperSttModel<L>,
  options?: ResourceOptions
) {
  // Resolves the model, the tokenizer and the nested VAD model in one pass,
  // with progress weighted across all three.
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createWhisperSpeechToText, resource);

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
