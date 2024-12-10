import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { ETError, getError } from '../../Error';
import { ObjectDetection } from '../../native/RnExecutorchModules';
import {
    ObjectDetectionModel,
    ObjectDetectionOutputType,
    ObjectDetectionResult,
} from './types';

interface Props {
  model: keyof typeof ObjectDetectionModel;
  path: string | number;
}

interface ObjectDetectionModule {
  error: string | null;
  isModelLoading: boolean;
  isModelGenerating: boolean;
  forward: (
    input: string,
    outputType: keyof typeof ObjectDetectionOutputType,
    topk: number // TODO: find an alternative way
  ) => Promise<ObjectDetectionResult>;
}

export const useObjectDetection = ({
  model,
  path,
}: Props): ObjectDetectionModule => {
  const [error, setError] = useState<null | string>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isModelGenerating, setIsModelGenerating] = useState(false);

  useEffect(() => {
    // TODO: handle the case where kind is wrong
    const loadModel = async () => {
      if (typeof path === 'number') {
        path = Image.resolveAssetSource(path).uri;
      }

      try {
        setIsModelLoading(true);
        await ObjectDetection.loadModule(path, model);
      } catch (e) {
        setError(getError(e));
      } finally {
        setIsModelLoading(false);
      }
    };

    loadModel();
  }, [path]);

  const forward = async (
    input: string,
    outptutType: keyof typeof ObjectDetectionOutputType,
    topk: number
  ) => {
    if (isModelLoading) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }

    try {
      setIsModelGenerating(true);
      const output = await ObjectDetection.forward(input, outptutType, topk);
      setIsModelGenerating(false);
      return output;
    } catch (e) {
      setIsModelGenerating(false);
      throw new Error(getError(e));
    }
  };

  return { error, isModelLoading, isModelGenerating, forward };
};
