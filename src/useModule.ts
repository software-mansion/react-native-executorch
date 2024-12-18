import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { ETError, getError } from './Error';
import { ETInput, module } from './types/common';

const getTypeIdentifier = (arr: ETInput): number => {
  if (arr instanceof Int8Array) return 0;
  if (arr instanceof Int32Array) return 1;
  if (arr instanceof BigInt64Array) return 2;
  if (arr instanceof Float32Array) return 3;
  if (arr instanceof Float64Array) return 4;

  return -1;
};

interface Props {
  modelSource: string | number;
  module: module;
}

interface _Module {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  forwardETInput: (input: ETInput, shape: number[]) => Promise<any>;
  forwardImage: (input: string) => Promise<any>;
}

export const useModule = ({ modelSource, module }: Props): _Module => {
  const [error, setError] = useState<null | string>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      if (!modelSource) return;
      let path = modelSource;

      if (typeof modelSource === 'number') {
        path = Image.resolveAssetSource(modelSource).uri;
      }

      try {
        setIsReady(false);
        await module.loadModule(path);
        setIsReady(true);
      } catch (e) {
        setError(getError(e));
      }
    };

    loadModel();
  }, [modelSource, module]);

  const forwardImage = async (input: string) => {
    if (!isReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    if (isGenerating) {
      throw new Error(getError(ETError.ModelGenerating));
    }

    try {
      setIsGenerating(true);
      const output = await module.forward(input);
      return output;
    } catch (e) {
      throw new Error(getError(e));
    } finally {
      setIsGenerating(false);
    }
  };

  const forwardETInput = async (input: ETInput, shape: number[]) => {
    if (!isReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    if (isGenerating) {
      throw new Error(getError(ETError.ModelGenerating));
    }

    const inputType = getTypeIdentifier(input);
    if (inputType === -1) {
      throw new Error(getError(ETError.InvalidArgument));
    }

    try {
      const numberArray = [...input];
      setIsGenerating(true);
      const output = await module.forward(numberArray, shape, inputType);
      setIsGenerating(false);
      return output;
    } catch (e) {
      setIsGenerating(false);
      throw new Error(getError(e));
    }
  };

  return { error, isReady, isGenerating, forwardETInput, forwardImage };
};
