import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { StyleTransfer } from './native/RnExecutorchModules';
import { ETError, getError } from './Error';

interface Props {
  modelSource: string | number;
}

interface StyleTransferModule {
  error: string | null;
  isModelReady: boolean;
  isModelGenerating: boolean;
  forward: (input: string) => Promise<string>;
}

export const useStyleTransfer = ({
  modelSource,
}: Props): StyleTransferModule => {
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
        await StyleTransfer.loadModule(path);
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
      const output = await StyleTransfer.forward(input);
      return output;
    } catch (e) {
      throw new Error(getError(e));
    } finally {
      setIsModelGenerating(false);
    }
  };

  return { error, isModelReady, isModelGenerating, forward };
};
