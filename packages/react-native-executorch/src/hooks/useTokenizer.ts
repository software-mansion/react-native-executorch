import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import { createTokenizer } from '../extensions/nlp/tasks/tokenization';

/**
 * React hook to load and use a HuggingFace tokenizer.
 *
 * This hook manages downloading the `tokenizer.json` file (if it's a remote
 * URL), loading it natively, tracking download progress and load errors, and
 * cleaning up native memory when the component unmounts or the source changes.
 * @category Hooks
 * @param tokenizerPath A remote URL or local path to a `tokenizer.json` file.
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and loading the
 * tokenizer.
 * @returns An object containing the tokenizer's loading state, error, download
 * progress, and tokenization functions.
 */
export function useTokenizer(tokenizerPath: string, options?: { preventLoad?: boolean }) {
  const { localPath, downloadProgress, downloadError } = useResourceDownload(
    tokenizerPath,
    options?.preventLoad
  );
  const { model, error } = useModel(createTokenizer, localPath ?? null, [localPath]);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    localPath,
    encode: model?.encode,
    decode: model?.decode,
    getVocabSize: model?.getVocabSize,
    idToToken: model?.idToToken,
    tokenToId: model?.tokenToId,
  };
}
