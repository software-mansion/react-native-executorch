import { useState } from 'react';
import { _ETModule } from '../../native/RnExecutorchModules';
import { useModule } from '../../useModule';
import { ETInput } from '../../types/common';
import { getError } from '../../Error';

interface Props {
  modelSource: string | number;
}

interface UseExecutorchModule {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  forward: (input: ETInput, shape: number[]) => Promise<number[][]>;
  loadMethod: (methodName: string) => Promise<void>;
  loadForward: () => Promise<void>;
}

export const useExecutorchModule = ({
  modelSource,
}: Props): UseExecutorchModule => {
  const [module, _] = useState(() => _ETModule);
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
