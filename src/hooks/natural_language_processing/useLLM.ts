import { useCallback, useEffect, useMemo, useState } from 'react';
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
Hook version of LLMController
*/
export const useLLM = ({
  modelSource,
  tokenizerSource,
  tokenizerConfigSource,
  preventLoad = false,
}: {
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
  tokenizerConfigSource: ResourceSource;
  preventLoad?: boolean;
}): LLMType => {
  const [response, setResponse] = useState('');
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<any>(null);

  const model = useMemo(
    () =>
      new LLMController({
        responseCallback: setResponse,
        messageHistoryCallback: setMessageHistory,
        isReadyCallback: setIsReady,
        isGeneratingCallback: setIsGenerating,
        onDownloadProgressCallback: setDownloadProgress,
        errorCallback: setError,
      }),
    []
  );

  useEffect(() => {
    setDownloadProgress(0);
    setError(null);

    if (!preventLoad) {
      (async () => {
        await model.load({
          modelSource,
          tokenizerSource,
          tokenizerConfigSource,
        });
      })();
    }

    return () => {
      model.delete();
    };
  }, [modelSource, tokenizerSource, tokenizerConfigSource, preventLoad, model]);

  // memoization of returned functions
  const configure = useCallback(
    ({
      chatConfig,
      toolsConfig,
    }: {
      chatConfig?: Partial<ChatConfig>;
      toolsConfig?: ToolsConfig;
    }) => model.configure({ chatConfig, toolsConfig }),
    [model]
  );

  const generate = useCallback(
    (messages: Message[], tools?: LLMTool[]) => model.generate(messages, tools),
    [model]
  );

  const sendMessage = useCallback(
    (message: string) => model.sendMessage(message),
    [model]
  );

  const deleteMessage = useCallback(
    (index: number) => model.deleteMessage(index),
    [model]
  );
  const interrupt = useCallback(() => model.interrupt(), [model]);

  return {
    messageHistory,
    response,
    isReady,
    isGenerating,
    downloadProgress,
    error,
    configure: configure,
    generate: generate,
    sendMessage: sendMessage,
    deleteMessage: deleteMessage,
    interrupt: interrupt,
  };
};
