import { useEffect, useState } from 'react';
import { ResourceSource, MessageType, LLMTool } from '../../types/common';
import { ChatConfig, LLMController } from '../../controllers/LLMController';

export interface LLMType {
  messageHistory: Array<MessageType>;
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
  const [messageHistory, setMessageHistory] = useState<Array<MessageType>>([]);
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
        modelDownloadProgressCallback: setDownloadProgress,
        errorCallback: setError,
        chatConfig: chatConfig,
      })
  );

  useEffect(() => {
    (async () => {
      await model.loadModel(
        modelSource,
        tokenizerSource,
        tokenizerConfigSource
      );
    })();

    return () => {
      model.deleteModel();
    };
  }, [modelSource, tokenizerSource, tokenizerConfigSource, model]);

  return {
    messageHistory,
    response,
    isReady,
    isGenerating,
    downloadProgress,
    error,
    runInference: model.runInference,
    sendMessage: model.sendMessage,
    interrupt: model.interrupt,
  };
};
