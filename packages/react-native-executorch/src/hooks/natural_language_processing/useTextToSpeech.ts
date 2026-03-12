import { useCallback, useEffect, useState } from 'react';
import { TextToSpeechModule } from '../../modules/natural_language_processing/TextToSpeechModule';
import {
  TextToSpeechProps,
  TextToSpeechInput,
  TextToSpeechPhonemeInput,
  TextToSpeechType,
  TextToSpeechStreamingCallbacks,
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

  // Shared streaming orchestration (guards + onBegin/onNext/onEnd lifecycle)
  const runStream = useCallback(
    async (
      methodName: string,
      generator: AsyncGenerator<Float32Array>,
      callbacks: TextToSpeechStreamingCallbacks
    ) => {
      guardReady(methodName);
      setIsGenerating(true);
      try {
        await callbacks.onBegin?.();
        for await (const audio of generator) {
          if (callbacks.onNext) {
            await callbacks.onNext(audio);
          }
        }
      } finally {
        await callbacks.onEnd?.();
        setIsGenerating(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isReady, isGenerating, moduleInstance]
  );

  const forward = async (input: TextToSpeechInput) => {
    const instance = guardReady('forward');
    try {
      setIsGenerating(true);
      return await instance.forward(input.text, input.speed ?? 1.0);
    } finally {
      setIsGenerating(false);
    }
  };

  const forwardFromPhonemes = async (input: TextToSpeechPhonemeInput) => {
    const instance = guardReady('forwardFromPhonemes');
    try {
      setIsGenerating(true);
      return await instance.forwardFromPhonemes(
        input.phonemes,
        input.speed ?? 1.0
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const stream = useCallback(
    async (input: TextToSpeechStreamingInput) => {
      const instance = guardReady('stream');
      await runStream(
        'stream',
        instance.stream({ text: input.text, speed: input.speed ?? 1.0 }),
        input
      );
    },
    [guardReady, runStream]
  );

  const streamFromPhonemes = useCallback(
    async (input: TextToSpeechStreamingPhonemeInput) => {
      const instance = guardReady('streamFromPhonemes');
      await runStream(
        'streamFromPhonemes',
        instance.streamFromPhonemes({
          phonemes: input.phonemes,
          speed: input.speed ?? 1.0,
        }),
        input
      );
    },
    [guardReady, runStream]
  );

  return {
    error,
    isReady,
    isGenerating,
    forward,
    forwardFromPhonemes,
    stream,
    streamFromPhonemes,
    streamStop: () => moduleInstance?.streamStop(),
    downloadProgress,
  };
};
