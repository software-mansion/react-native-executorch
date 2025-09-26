import { useCallback, useEffect, useState } from 'react';
import { ResourceSource } from '../../types/common';
import {
  ChatConfig,
  LLMTool,
  LLMType,
  Message,
  ToolsConfig,
} from '../../types/llm';
import { LLMController } from '../../controllers/LLMController';

/*
Hook version of LLMModule
*/
export const useLLM = ({
  model,
  preventLoad = false,
}: {
  model: {
    modelSource: ResourceSource;
    tokenizerSource: ResourceSource;
    tokenizerConfigSource: ResourceSource;
  };
  preventLoad?: boolean;
}): LLMType => {
  const [token, setToken] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<any>(null);

  const tokenCallback = useCallback((newToken: string) => {
    setToken(newToken);
    setResponse((prevResponse) => prevResponse + newToken);
  }, []);

  const [controllerInstance] = useState(
    () =>
      new LLMController({
        tokenCallback: tokenCallback,
        messageHistoryCallback: setMessageHistory,
        isReadyCallback: setIsReady,
        isGeneratingCallback: setIsGenerating,
      })
  );

  useEffect(() => {
    setDownloadProgress(0);
    setError(null);

    if (preventLoad) return;

    (async () => {
      try {
        await controllerInstance.load({
          modelSource: model.modelSource,
          tokenizerSource: model.tokenizerSource,
          tokenizerConfigSource: model.tokenizerConfigSource,
          onDownloadProgressCallback: setDownloadProgress,
        });
      } catch (e) {
        setError(e);
      }
    })();

    return () => {
      controllerInstance.delete();
    };
  }, [
    controllerInstance,
    model.modelSource,
    model.tokenizerSource,
    model.tokenizerConfigSource,
    preventLoad,
  ]);

  // memoization of returned functions
  const configure = useCallback(
    ({
      chatConfig,
      toolsConfig,
    }: {
      chatConfig?: Partial<ChatConfig>;
      toolsConfig?: ToolsConfig;
    }) => controllerInstance.configure({ chatConfig, toolsConfig }),
    [controllerInstance]
  );

  const generate = useCallback(
    (messages: Message[], tools?: LLMTool[]) => {
      setResponse('');
      return controllerInstance.generate(messages, tools);
    },
    [controllerInstance]
  );

  const sendMessage = useCallback(
    (message: string) => {
      setResponse('');
      return controllerInstance.sendMessage(message);
    },
    [controllerInstance]
  );

  const deleteMessage = useCallback(
    (index: number) => controllerInstance.deleteMessage(index),
    [controllerInstance]
  );

  const interrupt = useCallback(
    () => controllerInstance.interrupt(),
    [controllerInstance]
  );

  const getGeneratedTokenCount = useCallback(
    () => controllerInstance.getGeneratedTokenCount(),
    [controllerInstance]
  );

  const setCountInterval = useCallback(
    (countInterval: number) =>
      controllerInstance.setCountInterval(countInterval),
    [controllerInstance]
  );

  const setTimeInterval = useCallback(
    (timeInterval: number) => controllerInstance.setTimeInterval(timeInterval),
    [controllerInstance]
  );

  return {
    messageHistory,
    response,
    token,
    isReady,
    isGenerating,
    downloadProgress,
    error,
    getGeneratedTokenCount: getGeneratedTokenCount,
    setTimeInterval: setTimeInterval,
    setCountInterval: setCountInterval,
    configure: configure,
    generate: generate,
    sendMessage: sendMessage,
    deleteMessage: deleteMessage,
    interrupt: interrupt,
  };
};
