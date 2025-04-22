import { useCallback, useEffect, useRef, useState } from 'react';
import { EventSubscription } from 'react-native';
import { LLMNativeModule } from '../../native/RnExecutorchModules';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource, Model, MessageType } from '../../types/common';
import {
  DEFAULT_CONTEXT_WINDOW_LENGTH,
  DEFAULT_MESSAGE_HISTORY,
  DEFAULT_SYSTEM_PROMPT,
  EOT_TOKEN,
} from '../../constants/llamaDefaults';

const interrupt = () => {
  LLMNativeModule.interrupt();
};

export const useLLM = ({
  modelSource,
  tokenizerSource,
  systemPrompt = DEFAULT_SYSTEM_PROMPT,
  messageHistory = DEFAULT_MESSAGE_HISTORY,
  contextWindowLength = DEFAULT_CONTEXT_WINDOW_LENGTH,
}: {
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
  systemPrompt?: string;
  messageHistory?: MessageType[];
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

        const tokenizerFileUri = await ResourceFetcher.fetch(tokenizerSource);
        const modelFileUri = await ResourceFetcher.fetch(
          modelSource,
          setDownloadProgress
        );

        await LLMNativeModule.loadLLM(
          modelFileUri,
          tokenizerFileUri,
          systemPrompt,
          messageHistory,
          contextWindowLength
        );

        setIsReady(true);

        tokenGeneratedListener.current = LLMNativeModule.onToken(
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
      LLMNativeModule.deleteModule();
    };
  }, [
    modelSource,
    tokenizerSource,
    systemPrompt,
    messageHistory,
    contextWindowLength,
  ]);

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
        await LLMNativeModule.runInference(input);
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
