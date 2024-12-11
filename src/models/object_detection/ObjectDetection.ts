import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { ETError, getError } from '../../Error';
import { ObjectDetection } from '../../native/RnExecutorchModules';
import {
    ObjectDetectionResult,
} from './types';

interface Props {
  modelSource: string | number;
}

interface ObjectDetectionModule {
  error: string | null;
  isModelLoading: boolean;
  isModelGenerating: boolean;
  forward: (
    input: string,
  ) => Promise<ObjectDetectionResult>;
}

export const useObjectDetection = ({
  modelSource,
}: Props): ObjectDetectionModule => {
  const [error, setError] = useState<null | string>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isModelGenerating, setIsModelGenerating] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      if (typeof modelSource === 'number') {
        modelSource = Image.resolveAssetSource(modelSource).uri;
      }

      try {
        setIsModelLoading(true);
        await ObjectDetection.loadModule(modelSource);
      } catch (e) {
        setError(getError(e));
      } finally {
        setIsModelLoading(false);
      }
    };

    loadModel();
  }, [modelSource]);

  const forward = async (
    input: string,
  ) => {
    if (isModelLoading) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }

    try {
      setIsModelGenerating(true);
      const output = await ObjectDetection.forward(input);
      setIsModelGenerating(false);
      return output;
    } catch (e) {
      setIsModelGenerating(false);
      throw new Error(getError(e));
    }
  };

  return { error, isModelLoading, isModelGenerating, forward };
};
