import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import {
  createWhisperSpeechToText,
  type WhisperSttModel,
  type WhisperLanguage,
} from '../extensions/speech/tasks/whisperSpeechToText';

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
    transcribe: model?.transcribe,
    transcribeWorklet: model?.transcribeWorklet,
    stream: model?.stream,
    streamInsert: model?.streamInsert,
    streamStop: model?.streamStop,
  };
}
