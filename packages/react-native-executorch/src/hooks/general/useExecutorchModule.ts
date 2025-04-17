import { useState } from 'react';
import { _ETModule } from '../../native/RnExecutorchModules';
import { useModule } from '../useModule';
import { ETInput } from '../../types/common';
import { getError } from '../../Error';

interface Props {
  modelSource: string | number;
}

export const useExecutorchModule = ({
  modelSource,
}: Props): {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  forward: (
    input: ETInput | ETInput[],
    shape: number[] | number[][]
  ) => Promise<number[][]>;
  loadMethod: (methodName: string) => Promise<void>;
  loadForward: () => Promise<void>;
} => {
  const [module] = useState(() => new _ETModule());
  const {
    error,
    isReady,
    isGenerating,
    downloadProgress,
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
    downloadProgress,
    forward,
    loadMethod,
    loadForward,
  };
};
