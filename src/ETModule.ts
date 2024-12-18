import { useState } from 'react';
import { _ETModule } from './native/RnExecutorchModules';
import { getError } from './Error';
import { ExecutorchModule } from './types/common';
import { useModule } from './useModule';

interface Props {
  modelSource: string | number;
}

export const useExecutorchModule = ({
  modelSource,
}: Props): ExecutorchModule => {
  const [module] = useState(() => new _ETModule());
  const {
    error,
    isReady,
    isGenerating,
    forwardETInput: forward,
  } = useModule({
    modelSource,
    module,
  });

  const loadMethod = async (methodName: string) => {
    try {
      await module.loadMethod(methodName);
    } catch (e) {
      throw new Error(getError(e));
    }
  };

  const loadForward = async () => {
    await loadMethod('forward');
  };

  return {
    error,
    isReady,
    isGenerating,
    forward,
    loadMethod,
    loadForward,
  };
};
