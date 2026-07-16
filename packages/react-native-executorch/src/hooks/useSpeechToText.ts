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
  const fsmnVadPath = config.fsmnVoiceActivityDetectorPath;
  const vadResource = useResourceDownload(fsmnVadPath, options?.preventLoad);
  const modelResource = useResourceDownload(config.modelPath, options?.preventLoad);
  const tokenizerResource = useResourceDownload(config.tokenizerPath, options?.preventLoad);

  const localVadPath = vadResource.localPath;
  const localModelPath = modelResource.localPath;
  const localTokenizerPath = tokenizerResource.localPath;

  const isResourcesReady = !!(localModelPath && localTokenizerPath && localVadPath);
  const whisperConfig = isResourcesReady
    ? {
        ...config,
        modelPath: localModelPath!,
        tokenizerPath: localTokenizerPath!,
        fsmnVoiceActivityDetectorPath: localVadPath!,
      }
    : null;

  const { model, error: modelError } = useModel(createWhisperSpeechToText, whisperConfig, [
    localVadPath,
    localModelPath,
    localTokenizerPath,
  ]);

  const error =
    vadResource.downloadError ||
    modelResource.downloadError ||
    tokenizerResource.downloadError ||
    modelError;

  return {
    isReady: !!model,
    error,
    downloadProgress: modelResource.downloadProgress,
    localPath: modelResource.localPath,
    transcribe: model?.transcribe,
    transcribeWorklet: model?.transcribeWorklet,
    stream: model?.stream,
    streamInsert: model?.streamInsert,
    streamStop: model?.streamStop,
  };
}
