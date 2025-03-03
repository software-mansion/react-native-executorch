import { useEffect, useState } from 'react';
import {
  calculateDownloadProgres,
  fetchResource,
} from '../../utils/fetchResource';
import { symbols } from '../../constants/ocr/symbols';
import { getError, ETError } from '../../Error';
import { VerticalOCR } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { OCRDetection, OCRLanguage } from '../../types/ocr';

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

  useEffect(() => {
    const loadModel = async () => {
      try {
        if (
          Object.keys(detectorSources).length !== 2 ||
          Object.keys(recognizerSources).length !== 2
        )
          return;

        if (!symbols[language]) {
          setError(getError(ETError.LanguageNotSupported));
          return;
        }

        setIsReady(false);

        const recognizerPath = independentCharacters
          ? await fetchResource(
              recognizerSources.recognizerSmall,
              calculateDownloadProgres(3, 0, setDownloadProgress)
            )
          : await fetchResource(
              recognizerSources.recognizerLarge,
              calculateDownloadProgres(3, 0, setDownloadProgress)
            );

        const detectorPaths = {
          detectorLarge: await fetchResource(
            detectorSources.detectorLarge,
            calculateDownloadProgres(3, 1, setDownloadProgress)
          ),
          detectorNarrow: await fetchResource(
            detectorSources.detectorNarrow,
            calculateDownloadProgres(3, 2, setDownloadProgress)
          ),
        };

        await VerticalOCR.loadModule(
          detectorPaths.detectorLarge,
          detectorPaths.detectorNarrow,
          recognizerPath,
          symbols[language],
          independentCharacters
        );
        setIsReady(true);
      } catch (e) {
        setError(getError(e));
      }
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

  const forward = async (input: string) => {
    if (!isReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    if (isGenerating) {
      throw new Error(getError(ETError.ModelGenerating));
    }

    try {
      setIsGenerating(true);
      const output = await VerticalOCR.forward(input);
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
