import { useEffect, useMemo, useState } from 'react';
import { TokenizerModule } from '../../modules/natural_language_processing/TokenizerModule';
import { ResourceSource } from '../../types/common';
import { ETError, getError } from '../../Error';

export const useTokenizer = ({
  tokenizer,
  preventLoad = false,
}: {
  tokenizer: { tokenizerSource: ResourceSource };
  preventLoad?: boolean;
}) => {
  const [error, setError] = useState<null | string>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const _tokenizer = useMemo(() => new TokenizerModule(), []);

  useEffect(() => {
    if (preventLoad) return;
    (async () => {
      setDownloadProgress(0);
      setError(null);
      try {
        setIsReady(false);
        await _tokenizer.load(
          { tokenizerSource: tokenizer.tokenizerSource },
          setDownloadProgress
        );
        setIsReady(true);
      } catch (err) {
        setError((err as Error).message);
      }
    })();
  }, [_tokenizer, tokenizer.tokenizerSource, preventLoad]);

  const stateWrapper = <T extends (...args: any[]) => Promise<any>>(fn: T) => {
    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (!isReady) throw new Error(getError(ETError.ModuleNotLoaded));
      if (isGenerating) throw new Error(getError(ETError.ModelGenerating));
      try {
        setIsGenerating(true);
        return fn.apply(_tokenizer, args);
      } finally {
        setIsGenerating(false);
      }
    };
  };

  return {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    decode: stateWrapper(TokenizerModule.prototype.decode),
    encode: stateWrapper(TokenizerModule.prototype.encode),
    getVocabSize: stateWrapper(TokenizerModule.prototype.getVocabSize),
    idToToken: stateWrapper(TokenizerModule.prototype.idToToken),
    tokenToId: stateWrapper(TokenizerModule.prototype.tokenToId),
  };
};
