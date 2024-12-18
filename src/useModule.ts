import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { ETError, getError } from './Error';
import {
  _ClassificationModule,
  _ObjectDetectionModule,
  _StyleTransferModule,
} from './native/RnExecutorchModules';

interface Props {
  modelSource: string | number;
  module: _ClassificationModule | _StyleTransferModule | _ObjectDetectionModule;
}

interface _Module {
  error: string | null;
  isModelReady: boolean;
  isModelGenerating: boolean;
  forward: (input: string) => Promise<any>;
}

export const useModule = ({ modelSource, module }: Props): _Module => {
  const [error, setError] = useState<null | string>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isModelGenerating, setIsModelGenerating] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      if (!modelSource) return;
      let path = modelSource;

      if (typeof modelSource === 'number') {
        path = Image.resolveAssetSource(modelSource).uri;
      }

      try {
        setIsModelReady(false);
        await module.loadModule(path);
        setIsModelReady(true);
      } catch (e) {
        setError(getError(e));
      }
    };

    loadModel();
  }, [modelSource, module]);

  const forward = async (input: string) => {
    if (!isModelReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    if (isModelGenerating) {
      throw new Error(getError(ETError.ModelGenerating));
    }

    try {
      setIsModelGenerating(true);
      const output = await module.forward(input);
      return output;
    } catch (e) {
      throw new Error(getError(e));
    } finally {
      setIsModelGenerating(false);
    }
  };

  return { error, isModelReady, isModelGenerating, forward };
};
