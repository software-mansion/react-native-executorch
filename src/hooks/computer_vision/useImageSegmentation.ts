import { useState, useEffect } from 'react';
import { _ImageSegmentationModule } from '../../native/RnExecutorchModules';
import { fetchResource } from '../../utils/fetchResource';
import { ETError, getError } from '../../Error';

interface Props {
  modelSource: string | number;
}

export const useImageSegmentation = ({
  modelSource,
}: Props): {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  forward: (
    input: string,
    classesOfInterest?: string[]
  ) => Promise<{ [category: string]: number[] }>;
} => {
  const [module, _] = useState(() => new _ImageSegmentationModule());
  const [error, setError] = useState<null | string>(null);
  const [isReady, setIsReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      if (!modelSource) return;

      try {
        setIsReady(false);
        const fileUri = await fetchResource(modelSource, setDownloadProgress);
        await module.loadModule(fileUri);
        setIsReady(true);
      } catch (e) {
        setError(getError(e));
      }
    };

    loadModel();
  }, [modelSource, module]);

  const forward = async (input: string, classesOfInterest?: string[]) => {
    if (!isReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    if (isGenerating) {
      throw new Error(getError(ETError.ModelGenerating));
    }

    try {
      setIsGenerating(true);
      const output = await module.forward(input, classesOfInterest || []);
      return output;
    } catch (e) {
      throw new Error(getError(e));
    } finally {
      setIsGenerating(false);
    }
  };

  return { error, isReady, isGenerating, downloadProgress, forward };
};
