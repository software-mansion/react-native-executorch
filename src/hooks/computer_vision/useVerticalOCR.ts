import { useEffect, useState } from 'react';
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
  detectorSources,
  recognizerSources,
  language = 'en',
  independentCharacters = false,
}: {
  detectorSources: {
    detectorLarge: ResourceSource;
    detectorNarrow: ResourceSource;
  };
  recognizerSources: {
    recognizerLarge: ResourceSource;
    recognizerSmall: ResourceSource;
  };
  language?: OCRLanguage;
  independentCharacters?: boolean;
}): OCRModule => {
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [model, _] = useState(
    () =>
      new VerticalOCRController({
        modelDownloadProgressCallback: setDownloadProgress,
        isReadyCallback: setIsReady,
        isGeneratingCallback: setIsGenerating,
        errorCallback: setError,
      })
  );

  useEffect(() => {
    const loadModel = async () => {
      await model.loadModel(
        detectorSources,
        recognizerSources,
        language,
        independentCharacters
      );
    };

    loadModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(detectorSources),
    language,
    independentCharacters,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(recognizerSources),
  ]);

  return {
    error,
    isReady,
    isGenerating,
    forward: model.forward,
    downloadProgress,
  };
};
