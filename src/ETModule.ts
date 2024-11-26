import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { ETModule } from './native/RnExecutorchModule';

export enum ETError {
  FetcherError = -1,
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

export interface ExecutorchModule {
  forward: (input: ETInput, shape: BigInt64Array) => Promise<number[]>;
  loadMethod: (methodName: string) => Promise<void>;
  loadForward: () => Promise<void>;
}

interface Props {
  modulePath: string | number;
}

interface ReturnType {
  error: string | null;
  forward: (input: number[], shape: number[]) => Promise<number[]>;
  loadMethod: (methodName: string) => Promise<void>;
  loadForward: () => Promise<void>;
  isModelLoading: boolean;
}

const getError = (e: unknown): string => {
  const error = e as Error;
  const errorCode = parseInt(error.message, 10);
  if (errorCode in ETError) return ETError[errorCode] as string;
  return ETError[255] as string;
};

export const useExecutorchModule = ({
  modulePath,
}: Props): ReturnType | null => {
  const [error, setError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);

  useEffect(() => {
    const loadModel = async () => {
      let path = modulePath;
      if (typeof modulePath === 'number') {
        path = Image.resolveAssetSource(modulePath).uri;
      }

      try {
        await ETModule.loadModule(path);
        setIsModelLoading(false);
      } catch (e: unknown) {
        setError(getError(e));
        setIsModelLoading(false);
      }
    };
    loadModel();
  }, [modulePath]);

  const forward = async (input: number[], shape: number[]) => {
    try {
      const output = await ETModule.forward(input, shape);
      return output;
    } catch (e) {
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
    forward: forward,
    loadMethod: loadMethod,
    loadForward: loadForward,
  };
};
