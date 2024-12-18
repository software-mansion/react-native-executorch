import { useCallback, useEffect, useRef, useState } from 'react';
import { EventSubscription, Image } from 'react-native';
import { ResourceSource, Model } from './types/common';
import {
  DEFAULT_CONTEXT_WINDOW_LENGTH,
  DEFAULT_SYSTEM_PROMPT,
  EOT_TOKEN,
} from './constants/llamaDefaults';
import { LLM } from './native/RnExecutorchModules';

const interrupt = () => {
  LLM.interrupt();
};

export const useLLM = ({
  modelSource,
  tokenizerSource,
  systemPrompt = DEFAULT_SYSTEM_PROMPT,
  contextWindowLength = DEFAULT_CONTEXT_WINDOW_LENGTH,
}: {
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
  systemPrompt?: string;
  contextWindowLength?: number;
}): Model => {
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const downloadProgressListener = useRef<null | EventSubscription>(null);
  const tokenGeneratedListener = useRef<null | EventSubscription>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    const loadModel = async () => {
      try {
        let modelUrl = modelSource;
        let tokenizerUrl = tokenizerSource;
        if (typeof modelSource === 'number') {
          modelUrl = Image.resolveAssetSource(modelSource).uri;
        }
        if (typeof tokenizerSource === 'number') {
          tokenizerUrl = Image.resolveAssetSource(tokenizerSource).uri;
        }

        downloadProgressListener.current = LLM.onDownloadProgress(
          (data: number) => {
            if (data) {
              setDownloadProgress(data);
            }
          }
        );

        await LLM.loadLLM(
          modelUrl as string,
          tokenizerUrl as string,
          systemPrompt,
          contextWindowLength
        );

        setIsReady(true);

        tokenGeneratedListener.current = LLM.onToken(
          (data: string | undefined) => {
            if (!data) {
              return;
            }
            if (data !== EOT_TOKEN) {
              setResponse((prevResponse) => prevResponse + data);
            } else {
              setIsGenerating(false);
            }
          }
        );
      } catch (err) {
        const message = (err as Error).message;
        setIsReady(false);
        setError(message);
      }
    };

    loadModel();

    return () => {
      downloadProgressListener.current?.remove();
      downloadProgressListener.current = null;
      tokenGeneratedListener.current?.remove();
      tokenGeneratedListener.current = null;
      LLM.deleteModule();
    };
  }, [contextWindowLength, modelSource, systemPrompt, tokenizerSource]);

  const generate = useCallback(
    async (input: string): Promise<void> => {
      if (!isReady) {
        throw new Error('Model is still loading');
      }
      if (error) {
        throw new Error(error);
      }

      try {
        setResponse('');
        setIsGenerating(true);
        await LLM.runInference(input);
      } catch (err) {
        setIsGenerating(false);
        throw new Error((err as Error).message);
      }
    },
    [isReady, error]
  );

  return {
    generate,
    error,
    isReady,
    isGenerating,
    isModelReady: isReady,
    isModelGenerating: isGenerating,
    response,
    downloadProgress,
    interrupt,
  };
};
