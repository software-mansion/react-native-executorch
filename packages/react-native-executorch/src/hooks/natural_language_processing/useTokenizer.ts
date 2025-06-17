import { useEffect, useRef, useState } from 'react';
import { TokenizerModule } from '../../modules/natural_language_processing/TokenizerModule';
import { ResourceSource } from '../../types/common';
import { ETError, getError } from '../../Error';

export const useTokenizer = ({
  tokenizerSource,
  preventLoad = false,
}: {
  tokenizerSource: ResourceSource;
  preventLoad?: boolean;
}) => {
  const [error, setError] = useState<null | string>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const tokenizerModuleRef = useRef<TokenizerModule | null>(null);

  useEffect(() => {
    const loadModule = async () => {
      try {
        setIsReady(false);
        const tokenizer = new TokenizerModule();
        await tokenizer.load(tokenizerSource, setDownloadProgress);
        tokenizerModuleRef.current = tokenizer;
        setIsReady(true);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    if (!preventLoad) {
      loadModule();
    }
  }, [tokenizerSource, preventLoad]);

  const stateWrapper = <T extends (...args: any[]) => Promise<any>>(fn: T) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (!isReady || !tokenizerModuleRef.current)
        throw new Error(getError(ETError.ModuleNotLoaded));
      if (isGenerating) throw new Error(getError(ETError.ModelGenerating));

      setIsGenerating(true);
      try {
        return await fn.apply(tokenizerModuleRef.current, args);
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
