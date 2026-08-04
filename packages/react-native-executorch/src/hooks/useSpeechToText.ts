import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import {
  createWhisperSpeechToText,
  type WhisperSttModel,
  type WhisperLanguage,
} from '../extensions/speech/tasks/whisperSpeechToText';

/**
 * React hook to load and run a Whisper speech-to-text model.
 *
 * This hook manages downloading (if it's a remote URL) and loading the model,
 * tokenizer, and FSMN-VAD, compiling them, tracking download progress and
 * compilation errors, and cleaning up native model memory when the component
 * unmounts or configuration changes.
 * @category Hooks
 * @param config The Whisper speech-to-text model configuration.
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the
 * model.
 * @returns An object containing the model's loading state, error, download
 * progress, and transcription functions.
 */
export function useSpeechToText<L extends WhisperLanguage = WhisperLanguage>(
  config: WhisperSttModel<L>,
  options?: { preventLoad?: boolean }
) {
  // Resolves the model, the tokenizer and the nested VAD model in one pass,
  // with progress weighted across all three.
  const { resource, downloadProgress, downloadError } = useResourceDownload(
    config,
    options?.preventLoad
  );
  const { model, error } = useModel(createWhisperSpeechToText, resource ?? null, [resource]);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    localPath: resource?.modelPath,
    transcribe: model?.transcribe,
    transcribeWorklet: model?.transcribeWorklet,
    transcribeStop: model?.transcribeStop,
    stream: model?.stream,
    streamInsert: model?.streamInsert,
    streamStop: model?.streamStop,
  };
}
