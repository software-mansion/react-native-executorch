import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import {
  createTextEmbeddings,
  type TextEmbeddingsModel,
} from '../extensions/nlp/tasks/textEmbeddings';

/**
 * React hook to load and run a text embeddings model.
 *
 * This hook manages downloading (if they are remote URLs) and loading both the
 * model file and its `tokenizer.json`, tracking download progress and errors,
 * and cleaning up native memory when the component unmounts or the configuration
 * changes.
 * @category Hooks
 * @param config The text embeddings model configuration (model and tokenizer
 * paths).
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the
 * model.
 * @returns An object containing the model's loading state, error, download
 * progress, and embedding functions.
 */
export function useTextEmbeddings(
  config: TextEmbeddingsModel,
  options?: { preventLoad?: boolean }
) {
  const modelResource = useResourceDownload(config.modelPath, options?.preventLoad);
  const tokenizerResource = useResourceDownload(config.tokenizerPath, options?.preventLoad);

  const localModelPath = modelResource.localPath;
  const localTokenizerPath = tokenizerResource.localPath;

  const { model, error } = useModel(
    createTextEmbeddings,
    localModelPath && localTokenizerPath
      ? { modelPath: localModelPath, tokenizerPath: localTokenizerPath }
      : null,
    [localModelPath, localTokenizerPath]
  );

  return {
    isReady: !!model,
    error: modelResource.downloadError || tokenizerResource.downloadError || error,
    downloadProgress: (modelResource.downloadProgress + tokenizerResource.downloadProgress) / 2,
    forward: model?.forward,
    forwardWorklet: model?.forwardWorklet,
  };
}
