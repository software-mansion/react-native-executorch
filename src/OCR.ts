import { useEffect, useState } from 'react';
import { ResourceSource } from './types/common';
import { OCR } from './native/RnExecutorchModules';
import { ETError, getError } from './Error';
import { Image } from 'react-native';

interface OCRModule {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  forward: (input: string) => Promise<string>;
}

const getModelPath = (source: ResourceSource) => {
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
  recognizerSources: ResourceSource[];
  language?: string;
}): OCRModule => {
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      if (!detectorSource || recognizerSources.length === 0) return;

      const detectorPath = getModelPath(detectorSource);
      const recognizerPaths = recognizerSources.map(getModelPath);
      try {
        setIsReady(false);
        await OCR.loadModule(detectorPath, recognizerPaths, language);
        setIsReady(true);
      } catch (e) {
        setError(getError(e));
      }
    };

    loadModel();
  }, [detectorSource, language, recognizerSources.length]);

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
