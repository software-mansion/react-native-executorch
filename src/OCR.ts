import { useEffect, useState } from 'react';
import { ResourceSource } from './types/common';
import { OCR } from './native/RnExecutorchModules';
import { ETError, getError } from './Error';
import { Image } from 'react-native';
import { OCRDetection } from './types/ocr';
import { symbols } from './constants/ocr/symbols';
import { languageDicts } from './constants/ocr/languageDicts';

interface OCRModule {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  forward: (input: string) => Promise<OCRDetection[]>;
}

const getResourcePath = (source: ResourceSource) => {
  if (typeof source === 'number') {
    return Image.resolveAssetSource(source).uri;
  }
  return source;
};

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
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      if (!detectorSource || Object.keys(recognizerSources).length === 0)
        return;

      const detectorPath = getResourcePath(detectorSource);
      const recognizerPaths = {} as {
        recognizerLarge: string;
        recognizerMedium: string;
        recognizerSmall: string;
      };

      if (!symbols[language] || !languageDicts[language]) {
        setError(getError(ETError.LanguageNotSupported));
        return;
      }

      for (const key in recognizerSources) {
        if (recognizerSources.hasOwnProperty(key)) {
          recognizerPaths[key as keyof typeof recognizerPaths] =
            getResourcePath(
              recognizerSources[key as keyof typeof recognizerSources]
            );
        }
      }

      const languageDictPath = getResourcePath(languageDicts[language]);

      try {
        setIsReady(false);
        await OCR.loadModule(
          detectorPath,
          recognizerPaths.recognizerLarge,
          recognizerPaths.recognizerMedium,
          recognizerPaths.recognizerSmall,
          symbols[language],
          languageDictPath
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
  };
};