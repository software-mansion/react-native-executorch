import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import { createTokenizer } from '../extensions/nlp/tasks/tokenization';

/**
 * React hook to load and use a HuggingFace tokenizer.
 *
 * This hook manages downloading the `tokenizer.json` file (if it's a remote
 * URL), loading it natively, tracking download progress and load errors, and
 * cleaning up native memory when the component unmounts or the source changes.
 * @category Hooks
 * @param tokenizerPath A remote URL or local path to a `tokenizer.json` file.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns An object containing the tokenizer's loading state, error, download
 * progress, and tokenization functions.
 */
export function useTokenizer(tokenizerPath: string, options?: ResourceOptions) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(tokenizerPath, options);
  const { model, error } = useModel(createTokenizer, resource ?? null);

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
