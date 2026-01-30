import { useEffect, useState } from 'react';
import { TokenizerModule } from '../../modules/natural_language_processing/TokenizerModule';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';
import { TokenizerProps, TokenizerType } from '../../types/tokenizer';

/**
 * React hook for managing a Tokenizer instance.
 *
 * @category Hooks
 * @param tokenizerProps - Configuration object containing `tokenizer` source and optional `preventLoad` flag.
 * @returns Ready to use Tokenizer model.
 */
export const useTokenizer = ({
  tokenizer,
  preventLoad = false,
}: TokenizerProps): TokenizerType => {
  const [error, setError] = useState<null | RnExecutorchError>(null);
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
        setError(parseUnknownError(err));
      }
    })();
  }, [tokenizerInstance, tokenizer.tokenizerSource, preventLoad]);

  const stateWrapper = <T extends (...args: any[]) => Promise<any>>(fn: T) => {
    return (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      if (!isReady)
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModuleNotLoaded,
          'The model is currently not loaded. Please load the model before calling this function.'
        );
      if (isGenerating)
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModelGenerating,
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
