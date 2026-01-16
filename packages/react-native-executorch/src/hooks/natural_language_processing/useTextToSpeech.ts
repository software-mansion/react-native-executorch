import { useCallback, useEffect, useState } from 'react';
import { TextToSpeechModule } from '../../modules/natural_language_processing/TextToSpeechModule';
import {
  TextToSpeechConfig,
  TextToSpeechInput,
  TextToSpeechStreamingInput,
} from '../../types/tts';
import { ETError, getError } from '../../Error';

interface Props extends TextToSpeechConfig {
  preventLoad?: boolean;
}

export const useTextToSpeech = ({
  model,
  voice,
  options,
  preventLoad = false,
}: Props) => {
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [moduleInstance] = useState(() => new TextToSpeechModule());

  // Stabilize options to prevent unnecessary reloads when new object references are passed
  const optionsJson = JSON.stringify(options);

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
            options,
          },
          setDownloadProgress
        );
        setIsReady(true);
      } catch (err) {
        setError((err as Error).message);
      }
    })();

    return () => {
      moduleInstance.delete();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    moduleInstance,
    model.durationPredictorSource,
    model.f0nPredictorSource,
    model.textEncoderSource,
    model.textDecoderSource,
    voice?.voiceSource,
    voice?.extra,
    optionsJson,
    preventLoad,
  ]);

  const forward = async (input: TextToSpeechInput) => {
    if (!isReady) throw new Error(getError(ETError.ModuleNotLoaded));
    if (isGenerating) throw new Error(getError(ETError.ModelGenerating));
    try {
      setIsGenerating(true);
      return await moduleInstance.forward(input.text, input.speed ?? 1.0);
    } finally {
      setIsGenerating(false);
    }
  };

  const stream = useCallback(
    async (input: TextToSpeechStreamingInput) => {
      if (!isReady) throw new Error(getError(ETError.ModuleNotLoaded));
      if (isGenerating) throw new Error(getError(ETError.ModelGenerating));
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
    downloadProgress,
  };
};
