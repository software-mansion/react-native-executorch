import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { StyleTransfer } from './native/RnExecutorchModules';
import { ETError, getError } from './Error';

interface Props {
  modulePath: string | number;
}

interface StyleTransferModule {
  error: string | null;
  isModelLoading: boolean;
  isModelRunning: boolean;
  forward: (input: string) => Promise<string>;
}

export const useStyleTransfer = ({
  modulePath,
}: Props): StyleTransferModule => {
  const [error, setError] = useState<null | string>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isModelRunning, setIsModelRunning] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      let path = modulePath;

      if (typeof modulePath === 'number') {
        path = Image.resolveAssetSource(modulePath).uri;
      }

      try {
        setIsModelLoading(true);
        await StyleTransfer.loadModule(path);
      } catch (e) {
        setError(getError(e));
      } finally {
        setIsModelLoading(false);
      }
    };

    loadModel();
  }, [modulePath]);

  const forward = async (input: string) => {
    if (isModelLoading) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }

    try {
      setIsModelRunning(true);
      const output = await StyleTransfer.forward(input);
      return output;
    } catch (e) {
      throw new Error(getError(e));
    } finally {
      setIsModelRunning(false);
    }
  };

  return { error, isModelLoading, isModelRunning, forward };
};
