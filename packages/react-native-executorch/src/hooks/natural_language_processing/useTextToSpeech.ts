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

  // Shared guard for all generation methods
  const guardReady = useCallback(
    (methodName: string) => {
      if (!isReady)
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModuleNotLoaded,
          `The model is currently not loaded. Please load the model before calling ${methodName}().`
        );
      if (isGenerating)
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModelGenerating,
          'The model is currently generating. Please wait until previous model run is complete.'
        );
    },
    [isReady, isGenerating]
  );

  const forward = async (input: TextToSpeechInput) => {
    guardReady('forward');
    try {
      setIsGenerating(true);
      return await moduleInstance.forward(input.text ?? '', input.speed ?? 1.0);
    } finally {
      setIsGenerating(false);
    }
  };

  const forwardFromPhonemes = async (input: TextToSpeechPhonemeInput) => {
    guardReady('forwardFromPhonemes');
    try {
      setIsGenerating(true);
      return await moduleInstance.forwardFromPhonemes(
        input.phonemes ?? '',
        input.speed ?? 1.0
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const stream = useCallback(
    async (input: TextToSpeechStreamingInput) => {
      guardReady('stream');
      setIsGenerating(true);
      try {
        if (input.text) {
          moduleInstance.streamInsert(input.text);
        }

        await input.onBegin?.();
        for await (const audio of moduleInstance.stream({
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
    [moduleInstance, guardReady]
  );

  const streamFromPhonemes = useCallback(
    async (input: TextToSpeechStreamingPhonemeInput) => {
      guardReady('streamFromPhonemes');
      setIsGenerating(true);
      try {
        await input.onBegin?.();
        for await (const audio of moduleInstance.streamFromPhonemes({
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
    [moduleInstance, guardReady]
  );

  return {
    error,
    isReady,
    isGenerating,
    forward,
    forwardFromPhonemes,
    stream,
    streamFromPhonemes,
    streamInsert: (text: string) => moduleInstance.streamInsert(text),
    streamStop: (instant: boolean = true) => moduleInstance.streamStop(instant),
    downloadProgress,
  };
};
