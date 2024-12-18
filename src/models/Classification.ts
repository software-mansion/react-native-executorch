import { useState } from 'react';
import { _ClassificationModule } from '../native/RnExecutorchModules';
import { useModule } from '../useModule';

interface Props {
  modelSource: string | number;
}

interface ClassificationModule {
  error: string | null;
  isModelReady: boolean;
  isModelGenerating: boolean;
  forward: (input: string) => Promise<{ [category: string]: number }>;
}

export const useClassification = ({
  modelSource,
}: Props): ClassificationModule => {
  const [module, _] = useState(() => new _ClassificationModule());
  const { error, isModelReady, isModelGenerating, forward } = useModule({
    modelSource,
    module,
  });

  return { error, isModelReady, isModelGenerating, forward };
};
