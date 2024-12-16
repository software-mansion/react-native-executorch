import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { ETError, getError } from '../../Error';
import { ObjectDetection } from '../../native/RnExecutorchModules';
import { Detection } from './types';

interface Props {
  modelSource: string | number;
}

interface ObjectDetectionModule {
  error: string | null;
  isModelReady: boolean;
  isModelGenerating: boolean;
  forward: (input: string) => Promise<Detection[]>;
}

export const useObjectDetection = ({
  modelSource,
}: Props): ObjectDetectionModule => {
  const [error, setError] = useState<null | string>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isModelGenerating, setIsModelGenerating] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      let path = modelSource;
      if (typeof modelSource === 'number') {
        path = Image.resolveAssetSource(modelSource).uri;
      }

      try {
        setIsModelReady(false);
        await ObjectDetection.loadModule(path);
        setIsModelReady(true);
      } catch (e) {
        setError(getError(e));
      }
    };

    loadModel();
  }, [modelSource]);

  const forward = async (input: string) => {
    if (!isModelReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    if (isModelGenerating) {
      throw new Error(getError(ETError.ModelGenerating));
    }
    try {
      setIsModelGenerating(true);
      const output = await ObjectDetection.forward(input);
      return output;
    } catch (e) {
      throw new Error(getError(e));
    } finally {
      setIsModelGenerating(false);
    }
  };

  return { error, isModelReady, isModelGenerating, forward };
};
