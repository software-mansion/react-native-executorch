import { useState } from 'react';
import { _ImageSegmentationModule } from '../../native/RnExecutorchModules';
import { ETError, getError } from '../../Error';
import { useModule } from '../useModule';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const { error, isReady, downloadProgress } = useModule({
    modelSource,
    module,
  });

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
