import { useCallback, useEffect, useRef, useState } from 'react';
import { EventSubscription } from 'react-native';
import { LLM } from '../../native/RnExecutorchModules';
import { fetchResource } from '../../utils/fetchResource';
import { ResourceSource, Model } from '../../types/common';
import {
  DEFAULT_CONTEXT_WINDOW_LENGTH,
  DEFAULT_SYSTEM_PROMPT,
  EOT_TOKEN,
} from '../../constants/llamaDefaults';

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
  const tokenGeneratedListener = useRef<null | EventSubscription>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsReady(false);

        const tokenizerFileUri = await fetchResource(tokenizerSource);
        const modelFileUri = await fetchResource(
          modelSource,
          setDownloadProgress
        );

        await LLM.loadLLM(
          modelFileUri,
          tokenizerFileUri,
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
      } finally {
        setDownloadProgress(0);
      }
    };

    loadModel();

    return () => {
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
