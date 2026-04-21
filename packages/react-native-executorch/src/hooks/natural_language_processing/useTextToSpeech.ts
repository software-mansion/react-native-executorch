import { useCallback, useEffect, useState } from 'react';
import { TextToSpeechModule } from '../../modules/natural_language_processing/TextToSpeechModule';
import {
  TextToSpeechInput,
  TextToSpeechModelProps,
  TextToSpeechModelSources,
  TextToSpeechStreamingInput,
  TextToSpeechType,
  TextToSpeechVoiceConfig,
} from '../../types/tts';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

/**
 * React hook for managing Text to Speech instance.
 * @category Hooks
 * @param TextToSpeechModelProps - Configuration object containing `model` source, `voice` and optional `preventLoad`.
 * @returns Ready to use Text to Speech model.
 */
export const useTextToSpeech = ({
  model,
  voice,
  preventLoad = false,
}: TextToSpeechModelProps<
  TextToSpeechModelSources,
  TextToSpeechVoiceConfig
>): TextToSpeechType => {
  const [error, setError] = useState<RnExecutorchError | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [moduleInstance, setModuleInstance] =
    useState<TextToSpeechModule | null>(null);

  useEffect(() => {
    if (preventLoad) return;

    let active = true;
    setDownloadProgress(0);
    setError(null);
    setIsReady(false);

    TextToSpeechModule.fromModelName({ model, voice }, setDownloadProgress)
      .then((mod) => {
        if (!active) {
          mod.delete();
          return;
        }
        setModuleInstance((prev) => {
          prev?.delete();
          return mod;
        });
        setIsReady(true);
      })
      .catch((err) => {
        if (active) setError(parseUnknownError(err));
      });

    return () => {
      active = false;
      setModuleInstance((prev) => {
        prev?.delete();
        return null;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    model.modelName,
    model.durationPredictorSource,
    model.synthesizerSource,
    voice.voiceSource,
    voice.phonemizerConfig,
    preventLoad,
  ]);

  const guardReady = useCallback(
    (methodName: string): TextToSpeechModule => {
      if (!isReady || !moduleInstance)
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModuleNotLoaded,
          `The model is currently not loaded. Please load the model before calling ${methodName}().`
        );
      if (isGenerating)
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModelGenerating,
          'The model is currently generating. Please wait until previous model run is complete.'
        );
      return moduleInstance;
    },
    [isReady, isGenerating, moduleInstance]
  );

  const forward = async (input: TextToSpeechInput) => {
    const instance = guardReady('forward');
    try {
      setIsGenerating(true);
      return await instance.forward(input.text ?? '', input.speed ?? 1.0);
    } finally {
      setIsGenerating(false);
    }
  };

  const stream = useCallback(
    async (input: TextToSpeechStreamingInput) => {
      const instance = guardReady('stream');
      setIsGenerating(true);
      try {
        if (input.text) {
          instance.streamInsert(
            input.text +
              ('.?!;'.includes(input.text.trim().slice(-1)) ? '' : '.')
          );
        }

        await input.onBegin?.();
        for await (const audio of instance.stream({
          speed: input.speed ?? 1.0,
          stopAutomatically: input.stopAutomatically ?? true,
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
    [guardReady]
  );

  const streamInsert = useCallback(
    (text: string) => {
      if (moduleInstance) {
        moduleInstance.streamInsert(text);
      }
    },
    [moduleInstance]
  );

  const streamStop = useCallback(
    (instant: boolean = true) => {
      if (moduleInstance) {
        moduleInstance.streamStop(instant);
      }
    },
    [moduleInstance]
  );

  return {
    error,
    isReady,
    isGenerating,
    forward,
    stream,
    streamInsert,
    streamStop,
    downloadProgress,
  };
};
