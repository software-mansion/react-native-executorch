import { useState } from 'react';
import { _ObjectDetectionModule } from '../../native/RnExecutorchModules';
import { useModule } from '../../useModule';
import { Detection } from '../../types/object_detection';

interface Props {
  modelSource: string | number;
}

interface UseObjectDetection {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  forward: (input: string) => Promise<Detection[]>;
}

export const useObjectDetection = ({
  modelSource,
}: Props): UseObjectDetection => {
  const [module, _] = useState(() => _ObjectDetectionModule);
  const {
    error,
    isReady,
    isGenerating,
    forwardImage: forward,
  } = useModule({
    modelSource,
    module,
  });

  return { error, isReady, isGenerating, forward };
};
