import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import { createTextEmbedder, type TextEmbedderModel } from '../extensions/nlp/tasks/textEmbedding';

/**
 * React hook to load and run a text embedder model.
 *
 * This hook manages downloading (if they are remote URLs) and loading both the
 * model file and its `tokenizer.json`, tracking download progress and errors,
 * and cleaning up native memory when the component unmounts or the configuration
 * changes.
 * @category Hooks
 * @param config The text embedder model configuration (model and tokenizer
 * paths).
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the
 * model.
 * @returns An object containing the model's loading state, error, download
 * progress, and embedding functions.
 */
export function useTextEmbedder(config: TextEmbedderModel, options?: { preventLoad?: boolean }) {
  const modelResource = useResourceDownload(config.modelPath, options?.preventLoad);
  const tokenizerResource = useResourceDownload(config.tokenizerPath, options?.preventLoad);

  const localModelPath = modelResource.localPath;
  const localTokenizerPath = tokenizerResource.localPath;

  const { model, error } = useModel(
    createTextEmbedder,
    localModelPath && localTokenizerPath
      ? { modelPath: localModelPath, tokenizerPath: localTokenizerPath }
      : null,
    [localModelPath, localTokenizerPath]
  );

  return {
    isReady: !!model,
    error: modelResource.downloadError || tokenizerResource.downloadError || error,
    // The tokenizer is tiny relative to the model, so an average would misreport
    // progress; surface the model download progress directly.
    downloadProgress: modelResource.downloadProgress,
    localPath: localModelPath,
    tokenizerPath: localTokenizerPath,
    embed: model?.embed,
    embedWorklet: model?.embedWorklet,
  };
}
