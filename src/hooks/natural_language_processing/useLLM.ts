import { useCallback, useEffect, useRef, useState } from 'react';
import { EventSubscription } from 'react-native';
import { LLM } from '../../native/RnExecutorchModules';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource, LLMType } from '../../types/common';

const interrupt = () => {
  console.log('call interrupt');
  LLM.interrupt();
};

/*
Hook to use bare model and receive responses. It doesn't handle message history, or prompts. Those will be moved to useLLMChat
*/
export const useLLM = ({
  modelSource,
  tokenizerSource,
}: {
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
}): LLMType => {
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
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

        await LLM.loadLLM(modelFileUri, tokenizerFileUri);

        setIsReady(true);

        tokenGeneratedListener.current = LLM.onToken(
          (data: string | undefined) => {
            if (!data) {
              return;
            }
            console.log('new data:', data);
            setResponse((prevResponse) => prevResponse + data);
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
  }, [modelSource, tokenizerSource]);

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
        await LLM.runInference(input);
      } catch (err) {
        console.log('useLLM sets error', error);
        setError((err as Error).message);
        throw new Error((err as Error).message);
      }
    },
    [isReady, error]
  );

  return {
    generate,
    error,
    isReady,
    isModelReady: isReady,
    response,
    downloadProgress,
    interrupt,
  };
};
