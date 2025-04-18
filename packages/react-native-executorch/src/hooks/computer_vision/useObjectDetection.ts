import { useState } from 'react';
import { _ObjectDetectionModule } from '../../native/RnExecutorchModules';
import { useModule } from '../useModule';
import { Detection } from '../../types/object_detection';

interface Props {
  modelSource: string | number;
}

export const useObjectDetection = ({
  modelSource,
}: Props): {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  forward: (input: string) => Promise<Detection[]>;
} => {
  const [module, _] = useState(() => new _ObjectDetectionModule());
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
