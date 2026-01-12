import { useEffect, useState } from 'react';
import { ResourceSource } from '../../types/common';
import { OCRDetection, OCRLanguage } from '../../types/ocr';
import { VerticalOCRController } from '../../controllers/VerticalOCRController';

interface OCRModule {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  forward: (imageSource: string) => Promise<OCRDetection[]>;
  downloadProgress: number;
}

export const useVerticalOCR = ({
  model,
  independentCharacters = false,
  preventLoad = false,
}: {
  model: {
    detectorSource: ResourceSource;
    recognizer: ResourceSource;
    language: OCRLanguage;
  };
  independentCharacters?: boolean;
  preventLoad?: boolean;
}): OCRModule => {
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [controllerInstance] = useState(
    () =>
      new VerticalOCRController({
        isReadyCallback: setIsReady,
        isGeneratingCallback: setIsGenerating,
        errorCallback: setError,
      })
  );

  useEffect(() => {
    if (preventLoad) return;

    (async () => {
      await controllerInstance.load(
        model.detectorSource,
        model.recognizer,
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
    model.detectorSource,
    model.recognizer,
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
