import { useCallback, useEffect, useState } from 'react';
import { TextToSpeechModule } from '../../modules/natural_language_processing/TextToSpeechModule';
import {
  TextToSpeechProps,
  TextToSpeechInput,
  TextToSpeechPhonemeInput,
  TextToSpeechType,
  TextToSpeechStreamingInput,
  TextToSpeechStreamingPhonemeInput,
} from '../../types/tts';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

/**
 * React hook for managing Text to Speech instance.
 *
 * @category Hooks
 * @param TextToSpeechProps - Configuration object containing `model` source, `voice` and optional `preventLoad`.
 * @returns Ready to use Text to Speech model.
 */
export const useTextToSpeech = ({
  model,
  voice,
  preventLoad = false,
}: TextToSpeechProps): TextToSpeechType => {
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
    voice?.voiceSource,
    voice?.extra,
    preventLoad,
  ]);

  // Shared guard for all generation methods
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

  const forwardFromPhonemes = async (input: TextToSpeechPhonemeInput) => {
    const instance = guardReady('forwardFromPhonemes');
    try {
      setIsGenerating(true);
      return await instance.forwardFromPhonemes(
        input.phonemes ?? '',
        input.speed ?? 1.0
      );
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
          // If the initial text does not end with an end of sentence character,
          // we add an artificial dot to improve output's quality.
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

  const streamFromPhonemes = useCallback(
    async (input: TextToSpeechStreamingPhonemeInput) => {
      const instance = guardReady('streamFromPhonemes');
      setIsGenerating(true);
      try {
        await input.onBegin?.();
        for await (const audio of instance.streamFromPhonemes({
          phonemes: input.phonemes ?? '',
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
    forwardFromPhonemes,
    stream,
    streamFromPhonemes,
    streamInsert,
    streamStop,
    downloadProgress,
  };
};
