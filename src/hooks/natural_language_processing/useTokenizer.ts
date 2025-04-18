import { useEffect, useState } from 'react';
import { TokenizerModule } from '../../modules/natural_language_processing/TokenizerModule';
import { ResourceSource } from '../../types/common';
import { ETError, getError } from '../../Error';

export const useTokenizer = ({
  tokenizerSource,
}: {
  tokenizerSource: ResourceSource;
}) => {
  const [error, setError] = useState<null | string>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const loadModule = async () => {
      try {
        setIsReady(false);
        TokenizerModule.onDownloadProgress(setDownloadProgress);
        await TokenizerModule.load(tokenizerSource);
        setIsReady(true);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    loadModule();
  }, [tokenizerSource]);

  const stateWrapper = <T extends (...args: any[]) => Promise<any>>(fn: T) => {
    const boundFn = fn.bind(TokenizerModule);

    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (!isReady) throw new Error(getError(ETError.ModuleNotLoaded));
      if (isGenerating) throw new Error(getError(ETError.ModelGenerating));

      setIsGenerating(true);
      try {
        return await boundFn(...args);
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
    decode: stateWrapper(TokenizerModule.decode),
    encode: stateWrapper(TokenizerModule.encode),
    getVocabSize: stateWrapper(TokenizerModule.getVocabSize),
    idToToken: stateWrapper(TokenizerModule.idToToken),
    tokenToId: stateWrapper(TokenizerModule.tokenToId),
  };
};
