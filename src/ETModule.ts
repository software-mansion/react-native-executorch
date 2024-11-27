import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { ETModule } from './native/RnExecutorchModules';

export enum ETError {
  //react-native-ExecuTorch errors
  UndefinedError = -255,
  ModuleNotLoaded = -2,
  InvalidModelPath = -1,

  //ExecuTorch mapped errors

  // System errors
  Ok = 0,
  Internal = 1,
  InvalidState = 2,
  EndOfMethod = 3,

  // Logical errors
  NotSupported = 16,
  NotImplemented = 17,
  InvalidArgument = 18,
  InvalidType = 19,
  OperatorMissing = 20,

  // Resource errors
  NotFound = 32,
  MemoryAllocationFailed = 33,
  AccessFailed = 34,
  InvalidProgram = 35,

  // Delegate errors
  DelegateInvalidCompatibility = 48,
  DelegateMemoryAllocationFailed = 49,
  DelegateInvalidHandle = 50,
}

export type ETInput =
  | Int8Array
  | Int32Array
  | BigInt64Array
  | Float32Array
  | Float64Array;

interface Props {
  modulePath: string | number;
}

interface ExecutorchModule {
  error: string | null;
  isModelLoading: boolean;
  isModelRunning: boolean;
  forward: (input: ETInput, shape: number[]) => Promise<number[]>;
  loadMethod: (methodName: string) => Promise<void>;
  loadForward: () => Promise<void>;
}

const getError = (e: unknown): string => {
  const error = e as Error;
  const errorCode = parseInt(error.message, 10);
  if (errorCode in ETError) return ETError[errorCode] as string;
  return ETError[-3] as string;
};

const getTypeIdentifier = (arr: ETInput): number => {
  if (arr instanceof Int8Array) return 0;
  if (arr instanceof Int32Array) return 1;
  if (arr instanceof BigInt64Array) return 2;
  if (arr instanceof Float32Array) return 3;
  if (arr instanceof Float64Array) return 4;

  return -1;
};

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
      throw new Error(ETError[-2]);
    }

    const inputType = getTypeIdentifier(input);
    if (inputType === -1) {
      throw new Error(ETError[18]);
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
