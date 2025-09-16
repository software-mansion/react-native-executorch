import { useCallback, useEffect, useState } from 'react';
import { ETError, getError } from '../../Error';
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
    numSteps?: number
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
        setError((err as Error).message);
      }
    })();

    return () => {
      module.delete();
    };
  }, [module, model, preventLoad]);

  const generate = async (
    input: string,
    imageSize?: number,
    numSteps?: number
  ): Promise<string> => {
    if (!isReady) throw new Error(getError(ETError.ModuleNotLoaded));
    if (isGenerating) throw new Error(getError(ETError.ModelGenerating));
    try {
      setIsGenerating(true);
      return await module.forward(input, imageSize, numSteps);
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
