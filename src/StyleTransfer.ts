import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { StyleTransfer } from './native/RnExecutorchModules';
import { ETError, getError } from './Error';

interface Props {
  modulePath: string | number;
}

interface StyleTransferModule {
  error: string | null;
  isModelReady: boolean;
  isModelGenerating: boolean;
  forward: (input: string) => Promise<string>;
}

export const useStyleTransfer = ({
  modulePath,
}: Props): StyleTransferModule => {
  const [error, setError] = useState<null | string>(null);
  const [isModelReady, setIsModelReady] = useState(true);
  const [isModelGenerating, setIsModelGenerating] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      let path = modulePath;

      if (typeof modulePath === 'number') {
        path = Image.resolveAssetSource(modulePath).uri;
      }

      try {
        setIsModelReady(false);
        await StyleTransfer.loadModule(path);
      } catch (e) {
        setError(getError(e));
      } finally {
        setIsModelReady(true);
      }
    };

    loadModel();
  }, [modulePath]);

  const forward = async (input: string) => {
    if (!isModelReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }

    if (error) {
      throw new Error(error);
    }

    try {
      setIsModelGenerating(true);
      const output = await StyleTransfer.forward(input);
      setIsModelGenerating(false);
      return output;
    } catch (e) {
      setIsModelGenerating(false);
      throw new Error(getError(e));
    }
  };

  return { error, isModelReady, isModelGenerating, forward };
};
