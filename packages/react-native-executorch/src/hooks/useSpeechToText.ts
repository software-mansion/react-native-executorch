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
  const modelResource = useResourceDownload(config.modelPath, options?.preventLoad);
  const tokenizerResource = useResourceDownload(config.tokenizerPath, options?.preventLoad);

  const localModelPath = modelResource.localPath;
  const localTokenizerPath = tokenizerResource.localPath;

  const isResourcesReady = !!(localModelPath && localTokenizerPath);

  const whisperConfig = isResourcesReady
    ? {
        ...config,
        modelPath: localModelPath!,
        tokenizerPath: localTokenizerPath!,
      }
    : null;

  const { model, error } = useModel(createWhisperSpeechToText, whisperConfig, [
    localModelPath,
    localTokenizerPath,
  ]);

  return {
    isReady: !!model,
    error: modelResource.downloadError || tokenizerResource.downloadError || error,
    downloadProgress: (modelResource.downloadProgress + tokenizerResource.downloadProgress) / 2,
    transcribe: model?.transcribe,
    transcribeWorklet: model?.transcribeWorklet,
    stream: model?.stream,
    streamInsert: model?.streamInsert,
    streamStop: model?.streamStop,
  };
}
