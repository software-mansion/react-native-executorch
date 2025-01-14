import { useState } from 'react';
import { _ClassificationModule } from '../../native/RnExecutorchModules';
import { useModule } from '../../useModule';

interface Props {
  modelSource: string | number;
}

interface ClassificationModule {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  forward: (input: string) => Promise<{ [category: string]: number }>;
}

export const useClassification = ({
  modelSource,
}: Props): ClassificationModule => {
  const [module, _] = useState(() => new _ClassificationModule());
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
