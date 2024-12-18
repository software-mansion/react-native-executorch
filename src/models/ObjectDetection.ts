import { useState } from 'react';
import { _ObjectDetectionModule } from '../native/RnExecutorchModules';
import { useModule } from '../useModule';
import { Detection } from '../types/object_detection_types';

interface Props {
  modelSource: string | number;
}

interface ObjectDetectionModule {
  error: string | null;
  isModelReady: boolean;
  isModelGenerating: boolean;
  forward: (input: string) => Promise<Detection[]>;
}

export const useObjectDetection = ({
  modelSource,
}: Props): ObjectDetectionModule => {
  const [module, _] = useState(() => new _ObjectDetectionModule())
  const {error, isModelReady, isModelGenerating, forward} = useModule({modelSource, module})

  return { error, isModelReady, isModelGenerating, forward };
};
