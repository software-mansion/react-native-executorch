import { useEffect, useState } from 'react';
import { ResourceSource } from '../../types/common';
import { ChatConfig, LLMTool, MessageType } from '../../types/llm';
import { LLMController } from '../../controllers/LLMController';

export interface LLMType {
  messageHistory: MessageType[];
  response: string;
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  error: string | null;
  runInference: (input: string) => Promise<void>;
  sendMessage: (message: string, tools?: LLMTool[]) => Promise<void>;
  interrupt: () => void;
}

/*
Hook version of LLMController
*/
export const useLLM = ({
  modelSource,
  tokenizerSource,
  tokenizerConfigSource,
  chatConfig,
}: {
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
  tokenizerConfigSource: ResourceSource;
  chatConfig?: ChatConfig;
}): LLMType => {
  const [response, setResponse] = useState('');
  const [messageHistory, setMessageHistory] = useState<MessageType[]>([]);
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
    runInference: (input) => model.runInference(input),
    sendMessage: (message, tools) => model.sendMessage(message, tools),
    interrupt: model.interrupt,
  };
};
