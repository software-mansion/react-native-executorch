import { useEffect, useRef, useState } from 'react';
import { NewTokenizerModule } from '../../modules/natural_language_processing/NewTokenizerModule';
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
  const tokenizerModuleRef = useRef<NewTokenizerModule | null>(null);

  useEffect(() => {
    const loadModule = async () => {
      try {
        setIsReady(false);
        const tokenizer = new NewTokenizerModule();
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
    decode: stateWrapper(NewTokenizerModule.prototype.decode),
    encode: stateWrapper(NewTokenizerModule.prototype.encode),
    getVocabSize: stateWrapper(NewTokenizerModule.prototype.getVocabSize),
    idToToken: stateWrapper(NewTokenizerModule.prototype.idToToken),
    tokenToId: stateWrapper(NewTokenizerModule.prototype.tokenToId),
  };
};
