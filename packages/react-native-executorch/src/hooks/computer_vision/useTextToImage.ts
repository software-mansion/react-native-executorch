import { useCallback, useEffect, useState } from 'react';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { TextToImageModule } from '../../modules/computer_vision/TextToImageModule';
import { TextToImageParams, TextToImageType } from '../../types/tti';

/**
 * React hook for managing a Text to Image instance.
 * 
 * @param TextToImageConfiguration - Configuration object containing `model` source, `inferenceCallback`, and optional `preventLoad` flag.
 * @returns Ready to use Text to Image model.
 */
export const useTextToImage = ({
  model,
  inferenceCallback,
  preventLoad = false,
}: TextToImageParams): TextToImageType => {
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<RnExecutorchError | null>(null);

  const [module] = useState(() => new TextToImageModule(inferenceCallback));

  useEffect(() => {
    if (preventLoad) return;

    (async () => {
      setDownloadProgress(0);
      setError(null);
      try {
        setIsReady(false);
        await module.load(model, setDownloadProgress);
        setIsReady(true);
      } catch (err) {
        setError(parseUnknownError(err));
      }
    })();

    return () => {
      module.delete();
    };
  }, [module, model, preventLoad]);

  const generate = async (
    input: string,
    imageSize?: number,
    numSteps?: number,
    seed?: number
  ): Promise<string> => {
    if (!isReady)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    if (isGenerating)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModelGenerating,
        'The model is currently generating. Please wait until previous model run is complete.'
      );
    try {
      setIsGenerating(true);
      return await module.forward(input, imageSize, numSteps, seed);
    } finally {
      setIsGenerating(false);
    }
  };

  const interrupt = useCallback(() => {
    if (isGenerating) {
      module.interrupt();
    }
  }, [module, isGenerating]);

  return {
    isReady,
    isGenerating,
    downloadProgress,
    error,
    generate,
    interrupt,
  };
};
