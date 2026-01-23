import { useCallback, useEffect, useState } from 'react';
import { TextToSpeechModule } from '../../modules/natural_language_processing/TextToSpeechModule';
import {
  TextToSpeechConfig,
  TextToSpeechInput,
  TextToSpeechStreamingInput,
} from '../../types/tts';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

interface Props extends TextToSpeechConfig {
  preventLoad?: boolean;
}


/**
 * React hook for managing Text to Speech instance.
 * 
 * @param TextToSpeechConfiguration - Configuration object containing `model` source, `voice` and optional `preventLoad`.
 * @returns Ready to use Text to Speech model.
 */
export const useTextToSpeech = ({
  model,
  voice,
  preventLoad = false,
}: Props) => {
  const [error, setError] = useState<RnExecutorchError | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [moduleInstance] = useState(() => new TextToSpeechModule());

  useEffect(() => {
    if (preventLoad) return;

    (async () => {
      setDownloadProgress(0);
      setError(null);
      try {
        setIsReady(false);
        await moduleInstance.load(
          {
            model,
            voice,
          },
          setDownloadProgress
        );
        setIsReady(true);
      } catch (err) {
        setError(parseUnknownError(err));
      }
    })();

    return () => {
      moduleInstance.delete();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    moduleInstance,
    model.durationPredictorSource,
    model.synthesizerSource,
    voice?.voiceSource,
    voice?.extra,
    preventLoad,
  ]);

  const forward = async (input: TextToSpeechInput) => {
    if (!isReady)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    if (isGenerating)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModelGenerating,
        'The model is currently generating. Please wait until previous model run is complete.'
      );
    try {
      setIsGenerating(true);
      return await moduleInstance.forward(input.text, input.speed ?? 1.0);
    } finally {
      setIsGenerating(false);
    }
  };

  const stream = useCallback(
    async (input: TextToSpeechStreamingInput) => {
      if (!isReady)
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModuleNotLoaded,
          'The model is currently not loaded. Please load the model before calling stream().'
        );
      if (isGenerating)
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModelGenerating,
          'The model is currently generating. Please wait until previous model run is complete.'
        );
      setIsGenerating(true);
      try {
        await input.onBegin?.();
        for await (const audio of moduleInstance.stream({
          text: input.text,
          speed: input.speed ?? 1.0,
        })) {
          if (input.onNext) {
            await input.onNext(audio);
          }
        }
      } finally {
        await input.onEnd?.();
        setIsGenerating(false);
      }
    },
    [isReady, isGenerating, moduleInstance]
  );

  return {
    error,
    isReady,
    isGenerating,
    forward,
    stream,
    streamStop: moduleInstance.streamStop,
    downloadProgress,
  };
};
