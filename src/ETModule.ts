import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { ETModule } from './native/RnExecutorchModules';
import { ETError, getError } from './Error';
import { ETInput, ExecutorchModule } from './types';

const getTypeIdentifier = (arr: ETInput): number => {
  if (arr instanceof Int8Array) return 0;
  if (arr instanceof Int32Array) return 1;
  if (arr instanceof BigInt64Array) return 2;
  if (arr instanceof Float32Array) return 3;
  if (arr instanceof Float64Array) return 4;

  return -1;
};

interface Props {
  modulePath: string | number;
}

export const useExecutorchModule = ({
  modulePath,
}: Props): ExecutorchModule => {
  const [error, setError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isModelRunning, setIsModelRunning] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      let path = modulePath;
      if (typeof modulePath === 'number') {
        path = Image.resolveAssetSource(modulePath).uri;
      }

      try {
        setIsModelLoading(true);
        await ETModule.loadModule(path);
        setIsModelLoading(false);
      } catch (e: unknown) {
        setError(getError(e));
        setIsModelLoading(false);
      }
    };
    loadModel();
  }, [modulePath]);

  const forward = async (input: ETInput, shape: number[]) => {
    if (isModelLoading) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }

    const inputType = getTypeIdentifier(input);
    if (inputType === -1) {
      throw new Error(getError(ETError.InvalidArgument));
    }

    try {
      const numberArray = [...input];
      setIsModelRunning(true);
      const output = await ETModule.forward(numberArray, shape, inputType);
      setIsModelRunning(false);
      return output;
    } catch (e) {
      setIsModelRunning(false);
      throw new Error(getError(e));
    }
  };

  const loadMethod = async (methodName: string) => {
    try {
      await ETModule.loadMethod(methodName);
    } catch (e) {
      throw new Error(getError(e));
    }
  };

  const loadForward = async () => {
    await loadMethod('forward');
  };

  return {
    error: error,
    isModelLoading: isModelLoading,
    isModelRunning: isModelRunning,
    forward: forward,
    loadMethod: loadMethod,
    loadForward: loadForward,
  };
};
