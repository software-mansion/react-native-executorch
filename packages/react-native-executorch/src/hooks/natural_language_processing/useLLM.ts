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

  const _model = useMemo(
    () =>
      new LLMController({
        tokenCallback: tokenCallback,
        messageHistoryCallback: setMessageHistory,
        isReadyCallback: setIsReady,
        isGeneratingCallback: setIsGenerating,
      }),
    [tokenCallback]
  );

  useEffect(() => {
    setDownloadProgress(0);
    setError(null);

    if (preventLoad) return;

    (async () => {
      try {
        await _model.load({
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
      _model.delete();
    };
  }, [
    _model,
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
    }) => _model.configure({ chatConfig, toolsConfig }),
    [_model]
  );

  const generate = useCallback(
    (messages: Message[], tools?: LLMTool[]) => {
      setResponse('');
      return _model.generate(messages, tools);
    },
    [_model]
  );

  const sendMessage = useCallback(
    (message: string) => {
      setResponse('');
      return _model.sendMessage(message);
    },
    [_model]
  );

  const deleteMessage = useCallback(
    (index: number) => _model.deleteMessage(index),
    [_model]
  );

  const interrupt = useCallback(() => _model.interrupt(), [_model]);

  return {
    messageHistory,
    response,
    token,
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
