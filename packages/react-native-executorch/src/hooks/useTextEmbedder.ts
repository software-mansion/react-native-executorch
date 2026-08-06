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
  const { resource, downloadProgress, downloadError } = useResourceDownload(
    config,
    options?.preventLoad
  );
  const { model, error } = useModel(createTextEmbedder, resource ?? null, [resource]);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    embed: model?.embed,
    embedWorklet: model?.embedWorklet,
  };
}
