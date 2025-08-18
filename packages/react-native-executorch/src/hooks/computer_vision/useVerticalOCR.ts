import { useEffect, useMemo, useState } from 'react';
import { ResourceSource } from '../../types/common';
import { OCRDetection, OCRLanguage } from '../../types/ocr';
import { VerticalOCRController } from '../../controllers/VerticalOCRController';

interface OCRModule {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  forward: (input: string) => Promise<OCRDetection[]>;
  downloadProgress: number;
}

export const useVerticalOCR = ({
  model,
  independentCharacters = false,
  preventLoad = false,
}: {
  model: {
    detectorLarge: ResourceSource;
    detectorNarrow: ResourceSource;
    recognizerLarge: ResourceSource;
    recognizerSmall: ResourceSource;
    language: OCRLanguage;
  };
  independentCharacters?: boolean;
  preventLoad?: boolean;
}): OCRModule => {
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const controllerInstance = useMemo(
    () =>
      new VerticalOCRController({
        isReadyCallback: setIsReady,
        isGeneratingCallback: setIsGenerating,
        errorCallback: setError,
      }),
    []
  );

  useEffect(() => {
    if (preventLoad) return;

    (async () => {
      await controllerInstance.load(
        {
          detectorLarge: model.detectorLarge,
          detectorNarrow: model.detectorNarrow,
        },
        {
          recognizerLarge: model.recognizerLarge,
          recognizerSmall: model.recognizerSmall,
        },
        model.language,
        independentCharacters,
        setDownloadProgress
      );
    })();

    return () => {
      controllerInstance.delete();
    };
  }, [
    controllerInstance,
    model.detectorLarge,
    model.detectorNarrow,
    model.recognizerLarge,
    model.recognizerSmall,
    model.language,
    independentCharacters,
    preventLoad,
  ]);

  return {
    error,
    isReady,
    isGenerating,
    forward: controllerInstance.forward,
    downloadProgress,
  };
};
