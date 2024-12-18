import { useState } from 'react';
import { _ObjectDetectionModule } from '../native/RnExecutorchModules';
import { useModule } from '../useModule';
import { Detection } from '../types/object_detection';

interface Props {
  modelSource: string | number;
}

interface ObjectDetectionModule {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  forward: (input: string) => Promise<Detection[]>;
}

export const useObjectDetection = ({
  modelSource,
}: Props): ObjectDetectionModule => {
  const [module, _] = useState(() => new _ObjectDetectionModule());
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
