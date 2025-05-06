import { useEffect, useState } from 'react';
import { ResourceSource } from '../../types/common';
import { ChatConfig, LLMType, Message, ToolsConfig } from '../../types/llm';
import { LLMController } from '../../controllers/LLMController';

/*
Hook version of LLMController
*/
export const useLLM = ({
  modelSource,
  tokenizerSource,
  tokenizerConfigSource,
  chatConfig,
  toolsConfig,
}: {
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
  tokenizerConfigSource: ResourceSource;
  chatConfig?: Partial<ChatConfig>;
  toolsConfig?: ToolsConfig;
}): LLMType => {
  const [response, setResponse] = useState('');
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<any>(null);

  const [model, _] = useState(
    () =>
      new LLMController({
        responseCallback: setResponse,
        messageHistoryCallback: setMessageHistory,
        isReadyCallback: setIsReady,
        isGeneratingCallback: setIsGenerating,
        onDownloadProgressCallback: setDownloadProgress,
        errorCallback: setError,
        chatConfig: chatConfig,
        toolsConfig: toolsConfig,
      })
  );

  useEffect(() => {
    (async () => {
      await model.load({ modelSource, tokenizerSource, tokenizerConfigSource });
    })();

    return () => {
      model.delete();
    };
  }, [modelSource, tokenizerSource, tokenizerConfigSource, model]);

  return {
    messageHistory,
    response,
    isReady,
    isGenerating,
    downloadProgress,
    error,
    forward: (input) => model.forward(input),
    generate: (messages, tools) => model.generate(messages, tools),
    sendMessage: (message) => model.sendMessage(message),
    deleteMessage: (index) => model.deleteMessage(index),
    interrupt: () => model.interrupt(),
  };
};
