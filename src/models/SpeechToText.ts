import { useState, useEffect } from 'react';
import { Image } from 'react-native';
import {
  _SpeechToTextModule,
  _StyleTransferModule,
} from '../native/RnExecutorchModules';
import { ETError, getError } from '../Error';

interface Props {
  encoderSource: string | number;
  decoderSource: string | number;
}

interface SpeechToTextModule {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  encode: (input: number[][]) => Promise<number[][][]>;
  decode: (prevTokens: number[], encoderOutput: number[]) => Promise<number[]>;
}

export const useSpeechToText = ({ encoderSource, decoderSource }: Props): SpeechToTextModule => {
  const [module, _] = useState(() => new _SpeechToTextModule());
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // const { error, isReady, isGenerating } = useModule({
  //   modelSource,
  //   module,
  // });

  useEffect(() => {
    const loadModel = async () => {
      if (!encoderSource || !decoderSource) return;
      let encoderPath = encoderSource;
      let decoderPath = decoderSource

      if (typeof encoderSource === 'number' && typeof decoderSource === 'number') {
        encoderPath = Image.resolveAssetSource(encoderSource).uri;
        decoderPath = Image.resolveAssetSource(decoderSource).uri;
      }

      try {
        setIsReady(false);
        await module.loadModule(encoderPath, decoderPath);
        setIsReady(true);
      } catch (e) {
        setError(getError(e));
      }
    };

    loadModel();
  }, [encoderSource, module]);

  const encode = async (input: number[][]) => {
    if (!isReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    // if (isGenerating) {
    //   throw new Error(getError(ETError.ModelGenerating));
    // }
    try {
      setIsGenerating(true);
      console.log('Starting generation...');
      const output = await module.encode([...input]);
      console.log('Finished generation!');
      return output;
    } catch (e) {
      throw new Error(getError(e));
    } finally {
      setIsGenerating(false);
    }
  };

  const decode = async (prevTokens: number[], encoderOutput: number[]) => {
    if (!isReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    // if (isGenerating) {
    //   throw new Error(getError(ETError.ModelGenerating));
    // }
    try {
      // setIsGenerating(true);
      console.log('Starting generation...');
      const output = await module.decode(prevTokens, encoderOutput);
      console.log('Finished generation!');
      return output;
    } catch (e) {
      throw new Error(getError(e));
    } finally {
      // setIsGenerating(false);
    }
  };

  return { error, isReady, isGenerating, encode, decode };
};
