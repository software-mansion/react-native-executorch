import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { Classification } from '../native/RnExecutorchModules';
import { ETError, getError } from '../Error';

interface Props {
  modulePath: string | number;
}

interface ClassificationModule {
  error: string | null;
  isModelReady: boolean;
  isModelGenerating: boolean;
  forward: (input: string) => Promise<{ [category: string]: number }>;
}

export const useClassification = ({
  modulePath,
}: Props): ClassificationModule => {
  const [error, setError] = useState<null | string>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isModelGenerating, setIsModelGenerating] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      let path = modulePath;

      if (typeof modulePath === 'number') {
        path = Image.resolveAssetSource(modulePath).uri;
      }

      try {
        setIsModelReady(false);
        await Classification.loadModule(path);
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

    if (isModelGenerating) {
      throw new Error(getError(ETError.ModelGenerating));
    }

    try {
      setIsModelGenerating(true);
      const output = await Classification.forward(input);
      setIsModelGenerating(false);
      return output;
    } catch (e) {
      setIsModelGenerating(false);
      throw new Error(getError(e));
    }
  };

  return { error, isModelReady, isModelGenerating, forward };
};
