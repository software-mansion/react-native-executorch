import { useState } from 'react';
import { _ImageSegmentationModule } from '../../native/RnExecutorchModules';
import { ETError, getError } from '../../Error';
import { useModule } from '../useModule';
import { DeeplabLabel } from '../../types/image_segmentation';

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
    classesOfInterest?: DeeplabLabel[],
    resize?: boolean
  ) => Promise<{ [key in DeeplabLabel]?: number[] }>;
} => {
  const [module, _] = useState(() => new _ImageSegmentationModule());
  const [isGenerating, setIsGenerating] = useState(false);
  const { error, isReady, downloadProgress } = useModule({
    modelSource,
    module,
  });

  const forward = async (
    input: string,
    classesOfInterest?: DeeplabLabel[],
    resize?: boolean
  ) => {
    if (!isReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    if (isGenerating) {
      throw new Error(getError(ETError.ModelGenerating));
    }

    try {
      setIsGenerating(true);
      const stringDict = await module.forward(
        input,
        (classesOfInterest || []).map((label) => DeeplabLabel[label]),
        resize || false
      );

      let enumDict: { [key in DeeplabLabel]?: number[] } = {};

      for (const key in stringDict) {
        if (key in DeeplabLabel) {
          const enumKey = DeeplabLabel[key as keyof typeof DeeplabLabel];
          enumDict[enumKey] = stringDict[key];
        }
      }
      return enumDict;
    } catch (e) {
      throw new Error(getError(e));
    } finally {
      setIsGenerating(false);
    }
  };

  return { error, isReady, isGenerating, downloadProgress, forward };
};
