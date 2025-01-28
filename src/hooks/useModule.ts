import { useEffect, useState } from 'react';
import { fetchResource } from '../utils/fetchResource';
import { ETError, getError } from '../Error';
import { ETInput, Module } from '../types/common';

const getTypeIdentifier = (input: ETInput): number => {
  if (input instanceof Int8Array) return 1;
  if (input instanceof Int32Array) return 3;
  if (input instanceof BigInt64Array) return 4;
  if (input instanceof Float32Array) return 6;
  if (input instanceof Float64Array) return 7;
  return -1;
};

interface Props {
  modelSource: string | number;
  module: Module;
}

interface _Module {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  forwardETInput: (input: ETInput[] | ETInput, shape: number[][]) => Promise<any>;
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

  const forwardETInput = async (
    input: ETInput[] | ETInput,
    shape: number[][] | number[]
  ) => {
    if (!isReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    if (isGenerating) {
      throw new Error(getError(ETError.ModelGenerating));
    }

    // Since the native module expects an array of inputs and an array of shapes,
    // if the user provides a single ETInput, we want to "unsqueeze" the array so 
    // the data is properly processed on the native side
    if (!Array.isArray(input)) {
      input = [input];
    }
    if (!Array.isArray(shape)) {
      shape = [shape];
    }
    let inputTypeIdentifiers = [];
    let modelInputs = [];

    for (let idx = 0; idx < input.length; idx++) {
      let currentInputTypeIdentifier = getTypeIdentifier(input[idx] as ETInput);
      if (currentInputTypeIdentifier == -1) {
        throw new Error(getError(ETError.InvalidArgument));
      }
      inputTypeIdentifiers.push(currentInputTypeIdentifier);
      modelInputs.push([...(input[idx] as ETInput)]);
    }

    try {
      setIsGenerating(true);
      const output = await module.forward(
        modelInputs,
        shape,
        inputTypeIdentifiers
      );
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
