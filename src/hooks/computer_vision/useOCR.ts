import { useEffect, useState } from 'react';
import { ResourceSource } from '../../types/common';
import { OCRDetection, OCRLanguage } from '../../types/ocr';
import { OCRController } from '../../controllers/OCRController';

interface OCRModule {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  forward: (input: string) => Promise<OCRDetection[]>;
  downloadProgress: number;
}

export const useOCR = ({
  detectorSource,
  recognizerSources,
  language = 'en',
}: {
  detectorSource: ResourceSource;
  recognizerSources: {
    recognizerLarge: ResourceSource;
    recognizerMedium: ResourceSource;
    recognizerSmall: ResourceSource;
  };
  language?: OCRLanguage;
}): OCRModule => {
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [model, _] = useState(
    () =>
      new OCRController({
        modelDownloadProgressCallback: setDownloadProgress,
        isReadyCallback: setIsReady,
        isGeneratingCallback: setIsGenerating,
        errorCallback: setError,
      })
  );

  useEffect(() => {
    const loadModel = async () => {
      await model.loadModel(detectorSource, recognizerSources, language);
    };

    loadModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectorSource, language, JSON.stringify(recognizerSources)]);

  return {
    error,
    isReady,
    isGenerating,
    forward: model.forward,
    downloadProgress,
  };
};
