import { useState } from 'react';
import { _ImageSegmentationModule } from '../../native/RnExecutorchModules';
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
  forward: (input: string) => Promise<{ [category: string]: number[] }>;
} => {
  const [module, _] = useState(() => new _ImageSegmentationModule());
  const {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    forwardImage: forward,
  } = useModule({
    modelSource,
    module,
  });

  return { error, isReady, isGenerating, downloadProgress, forward };
};
