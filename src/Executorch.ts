import { useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'react-native';
import RnExecutorch, {
  subscribeToDownloadProgress,
  subscribeToTokenGenerated,
} from './RnExecutorchModule';
import {
  DEFAULT_CONTEXT_WINDOW_LENGTH,
  DEFAULT_SYSTEM_PROMPT,
  EOT_TOKEN,
} from './constants';
import { ResourceSource, Model } from './types';

const interrupt = () => {
  RnExecutorch.interrupt();
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
  const [isModelReady, setIsModelReady] = useState(false);
  const [isModelGenerating, setIsModelGenerating] = useState(false);
  const [response, setResponse] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    let unsubscribeTokenGenerated: () => void;
    let unsubscribeDownloadProgress: () => void;
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
        unsubscribeDownloadProgress = subscribeToDownloadProgress((data) => {
          if (data) {
            setDownloadProgress(data);
          }
        });
        await RnExecutorch.loadLLM(
          modelUrl as string,
          tokenizerUrl as string,
          systemPrompt,
          contextWindowLength
        );
        setIsModelReady(true);
        unsubscribeTokenGenerated = subscribeToTokenGenerated((data) => {
          if (!data) {
            return;
          }
          if (data !== EOT_TOKEN) {
            setResponse((prevResponse) => prevResponse + data);
          } else {
            setIsModelGenerating(false);
          }
        });
      } catch (err) {
        const message = (err as Error).message;
        setIsModelReady(false);
        setError(message);
      }
    };

    loadModel();

    return () => {
      if (unsubscribeTokenGenerated) unsubscribeTokenGenerated();
      if (unsubscribeDownloadProgress) unsubscribeDownloadProgress();
      RnExecutorch.deleteModule();
    };
  }, [contextWindowLength, modelSource, systemPrompt, tokenizerSource]);

  const generate = useCallback(
    async (input: string): Promise<void> => {
      if (!isModelReady) {
        throw new Error('Model is still loading');
      }
      if (error) {
        throw new Error(error);
      }

      try {
        setResponse('');
        setIsModelGenerating(true);
        await RnExecutorch.runInference(input);
      } catch (err) {
        setIsModelGenerating(false);
        throw new Error((err as Error).message);
      }
    },
    [isModelReady, error]
  );

  return {
    generate,
    error,
    isModelReady,
    isModelGenerating,
    response,
    downloadProgress,
    interrupt,
  };
};
