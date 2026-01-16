import { useEffect, useState } from 'react';
import { ResourceSource } from '../../types/common';
import { OCRDetection, OCRLanguage } from '../../types/ocr';
import { OCRController } from '../../controllers/OCRController';

interface OCRModule {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  forward: (imageSource: string) => Promise<OCRDetection[]>;
  downloadProgress: number;
}

export const useOCR = ({
  model,
  preventLoad = false,
}: {
  model: {
    detectorSource: ResourceSource;
    recognizerSource: ResourceSource;
    language: OCRLanguage;
  };
  preventLoad?: boolean;
}): OCRModule => {
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [controllerInstance] = useState(
    () =>
      new OCRController({
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
        model.recognizerSource,
        model.language,
        setDownloadProgress
      );
    })();

    return () => {
      controllerInstance.delete();
    };
  }, [
    controllerInstance,
    model.detectorSource,
    model.recognizerSource,
    model.language,
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
