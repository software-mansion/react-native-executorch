import { useEffect, useState } from 'react';
import { TextToSpeechModule } from '../../modules/natural_language_processing/TextToSpeechModule';
import { TextToSpeechConfig, TextToSpeechInput } from '../../types/tts';
import { ETError, getError } from '../../Error';

interface Props extends TextToSpeechConfig {
  preventLoad?: boolean;
}

export const useTextToSpeech = ({
  model,
  voice,
  preventLoad = false,
}: Props) => {
  const [error, setError] = useState<string | null>(null);
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
        await moduleInstance.load({ model, voice }, setDownloadProgress);
        setIsReady(true);
      } catch (err) {
        setError((err as Error).message);
      }
    })();

    return () => {
      moduleInstance.delete();
    };
  }, [moduleInstance, model, voice, preventLoad]);

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

  return {
    error,
    isReady,
    isGenerating,
    forward,
    downloadProgress,
  };
};
