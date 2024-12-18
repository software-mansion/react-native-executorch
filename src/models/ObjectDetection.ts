import { useState } from 'react';
import { ObjectDetectionModule } from '../native/RnExecutorchModules';
import { useModule } from '../useModule';
import { Detection } from '../types/object_detection_types';

interface Props {
  modelSource: string | number;
}

interface _ObjectDetectionModule {
  error: string | null;
  isModelReady: boolean;
  isModelGenerating: boolean;
  forward: (input: string) => Promise<Detection[]>;
}

export const useObjectDetection = ({
  modelSource,
}: Props): _ObjectDetectionModule => {
  const [_class, _] = useState(() => new ObjectDetectionModule())
  const {error, isModelReady, isModelGenerating, forward} = useModule({modelSource, _class})

  return { error, isModelReady, isModelGenerating, forward };
};
