import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { ETError, getError } from './Error';

interface Props {
  modelSource: string | number;
  _class: any;
}

interface _Module {
  error: string | null;
  isModelReady: boolean;
  isModelGenerating: boolean;
  forward: (input: string) => Promise<any>;
}

export const useModule = ({
  modelSource,
  _class
}: Props): _Module => {
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
        await _class.loadModule(path);
        setIsModelReady(true);
      } catch (e) {
        setError(getError(e));
      }
    };

    loadModel();
  }, [modelSource, _class]);

  const forward = async (input: string) => {
    if (!isModelReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    if (isModelGenerating) {
      throw new Error(getError(ETError.ModelGenerating));
    }

    try {
      setIsModelGenerating(true);
      const output = await _class.forward(input);
      return output;
    } catch (e) {
      throw new Error(getError(e));
    } finally {
      setIsModelGenerating(false);
    }
  };

  return { error, isModelReady, isModelGenerating, forward };
};
