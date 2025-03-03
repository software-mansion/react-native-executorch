import { useEffect, useState } from 'react';
import {
  calculateDownloadProgres,
  fetchResource,
} from '../../utils/fetchResource';
import { symbols } from '../../constants/ocr/symbols';
import { getError, ETError } from '../../Error';
import { OCR } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { OCRDetection, OCRLanguage } from '../../types/ocr';

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

  useEffect(() => {
    const loadModel = async () => {
      try {
        if (!detectorSource || Object.keys(recognizerSources).length !== 3)
          return;

        if (!symbols[language]) {
          setError(getError(ETError.LanguageNotSupported));
          return;
        }

        setIsReady(false);

        const detectorPath = await fetchResource(
          detectorSource,
          calculateDownloadProgres(4, 0, setDownloadProgress)
        );

        const recognizerPaths = {
          recognizerLarge: await fetchResource(
            recognizerSources.recognizerLarge,
            calculateDownloadProgres(4, 1, setDownloadProgress)
          ),
          recognizerMedium: await fetchResource(
            recognizerSources.recognizerMedium,
            calculateDownloadProgres(4, 2, setDownloadProgress)
          ),
          recognizerSmall: await fetchResource(
            recognizerSources.recognizerSmall,
            calculateDownloadProgres(4, 3, setDownloadProgress)
          ),
        };

        await OCR.loadModule(
          detectorPath,
          recognizerPaths.recognizerLarge,
          recognizerPaths.recognizerMedium,
          recognizerPaths.recognizerSmall,
          symbols[language]
        );
        setIsReady(true);
      } catch (e) {
        setError(getError(e));
      }
    };

    loadModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectorSource, language, JSON.stringify(recognizerSources)]);

  const forward = async (input: string) => {
    if (!isReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    if (isGenerating) {
      throw new Error(getError(ETError.ModelGenerating));
    }

    try {
      setIsGenerating(true);
      const output = await OCR.forward(input);
      return output;
    } catch (e) {
      throw new Error(getError(e));
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    error,
    isReady,
    isGenerating,
    forward,
    downloadProgress,
  };
};
