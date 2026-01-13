import { useEffect, useState } from 'react';
import { TokenizerModule } from '../../modules/natural_language_processing/TokenizerModule';
import { ResourceSource } from '../../types/common';
import { ETErrorCode } from '../../errors/ErrorCodes';
import { ExecutorchError, parseUnknownError } from '../../errors/errorUtils';

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
  const [tokenizerInstance] = useState(() => new TokenizerModule());

  useEffect(() => {
    if (preventLoad) return;
    (async () => {
      setDownloadProgress(0);
      setError(null);
      try {
        setIsReady(false);
        await tokenizerInstance.load(
          { tokenizerSource: tokenizer.tokenizerSource },
          setDownloadProgress
        );
        setIsReady(true);
      } catch (err) {
        setError(parseUnknownError(err).message);
      }
    })();
  }, [tokenizerInstance, tokenizer.tokenizerSource, preventLoad]);

  const stateWrapper = <T extends (...args: any[]) => Promise<any>>(fn: T) => {
    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (!isReady)
        throw new ExecutorchError(
          ETErrorCode.ModuleNotLoaded,
          'The model is currently not loaded. Please load the model before calling this function.'
        );
      if (isGenerating)
        throw new ExecutorchError(
          ETErrorCode.ModelGenerating,
          'The model is currently generating. Please wait until previous model run is complete.'
        );
      try {
        setIsGenerating(true);
        return fn.apply(tokenizerInstance, args);
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
