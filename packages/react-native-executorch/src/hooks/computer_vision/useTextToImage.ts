import { useCallback, useEffect, useState } from 'react';
import { ExecutorchError, parseUnknownError } from '../../errors/errorUtils';
import { ETErrorCode } from '../../errors/ErrorCodes';
import { ResourceSource } from '../../types/common';
import { TextToImageModule } from '../../modules/computer_vision/TextToImageModule';

interface TextToImageType {
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  error: string | null;
  generate: (
    input: string,
    imageSize?: number,
    numSteps?: number,
    seed?: number
  ) => Promise<string>;
  interrupt: () => void;
}

export const useTextToImage = ({
  model,
  inferenceCallback,
  preventLoad = false,
}: {
  model: {
    tokenizerSource: ResourceSource;
    schedulerSource: ResourceSource;
    encoderSource: ResourceSource;
    unetSource: ResourceSource;
    decoderSource: ResourceSource;
  };
  inferenceCallback?: (stepIdx: number) => void;
  preventLoad?: boolean;
}): TextToImageType => {
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
        setError(parseUnknownError(err).message);
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
      throw new ExecutorchError(
        ETErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    if (isGenerating)
      throw new ExecutorchError(
        ETErrorCode.ModelGenerating,
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
