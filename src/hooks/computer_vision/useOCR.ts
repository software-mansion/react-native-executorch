import { useEffect, useState } from 'react';
import { fetchResource } from '../../utils/fetchResource';
import { languageDicts } from '../../constants/ocr/languageDicts';
import { symbols } from '../../constants/ocr/symbols';
import { getError, ETError } from '../../Error';
import { _OCRModule } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { OCRDetection } from '../../types/ocr';

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
  language?: string;
}): OCRModule => {
  const [module, _] = useState(() => new _OCRModule());
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const loadModel = async () => {
      try {
        if (!detectorSource || Object.keys(recognizerSources).length === 0)
          return;

        const recognizerPaths = {} as {
          recognizerLarge: string;
          recognizerMedium: string;
          recognizerSmall: string;
        };

        if (!symbols[language] || !languageDicts[language]) {
          setError(getError(ETError.LanguageNotSupported));
          return;
        }

        const detectorPath = await fetchResource(detectorSource);

        await Promise.all([
          fetchResource(recognizerSources.recognizerLarge, setDownloadProgress),
          fetchResource(recognizerSources.recognizerMedium),
          fetchResource(recognizerSources.recognizerSmall),
        ]).then((values) => {
          recognizerPaths.recognizerLarge = values[0];
          recognizerPaths.recognizerMedium = values[1];
          recognizerPaths.recognizerSmall = values[2];
        });

        setIsReady(false);
        await module.loadModule(
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
      const output = await module.forward(input);
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
