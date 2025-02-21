import { useEffect, useState } from 'react';
import { fetchResource } from '../utils/fetchResource';
import { ETError, getError } from '../Error';
import { ETInput, Module, getTypeIdentifier } from '../types/common';

interface Props {
  modelSource: string | number;
  module: Module;
}

interface _Module {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  forwardETInput: (input: ETInput, shape: number[]) => Promise<any>;
  forwardImage: (input: string) => Promise<any>;
}

export const useModule = ({ modelSource, module }: Props): _Module => {
  const [error, setError] = useState<null | string>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const loadModel = async () => {
      if (!modelSource) return;

      try {
        setIsReady(false);
        const fileUri = await fetchResource(modelSource, setDownloadProgress);
        await module.loadModule(fileUri);
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

  return {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    forwardETInput,
    forwardImage,
  };
};
