import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import { createTokenizer } from '../extensions/nlp/tasks/tokenization';

/**
 * React hook to load and run a tokenizer.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * tokenizer configuration files, tracking download progress and load errors,
 * and releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createTokenizer}.
 * @category Hooks
 * @param tokenizerPath A remote URL or local path to a `tokenizer.json` file.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns An object containing the tokenizer's loading state, error, download
 * progress, and tokenization functions.
 * @see {@link createTokenizer}
 */
export function useTokenizer(tokenizerPath: string, options?: ResourceOptions) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(tokenizerPath, options);
  const { model, error } = useModel(createTokenizer, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    encode: model?.encode,
    decode: model?.decode,
    getVocabSize: model?.getVocabSize,
    idToToken: model?.idToToken,
    tokenToId: model?.tokenToId,
  };
}
