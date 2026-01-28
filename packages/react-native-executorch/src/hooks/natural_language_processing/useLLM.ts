import { useCallback, useEffect, useState } from 'react';
import { ResourceSource } from '../../types/common';
import {
  LLMConfig,
  LLMTool,
  LLMType,
  Message,
} from '../../types/llm';
import { LLMController } from '../../controllers/LLMController';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

/**
 * React hook for managing a Large Language Model (LLM) instance.
 * 
 * @category Hooks
 * @param model - Object containing model, tokenizer, and tokenizer config sources.
 * @returns An object implementing the `LLMType` interface for interacting with the LLM.
 */
export const useLLM = ({
  model,
  preventLoad = false,
}: {
  model: {
    /**
     * `ResourceSource` that specifies the location of the model binary.
     */
    modelSource: ResourceSource;
    /**
     * `ResourceSource pointing` to the JSON file which contains the tokenizer.
     */
    tokenizerSource: ResourceSource;
    /**
     * `ResourceSource` pointing to the JSON file which contains the tokenizer config.
     */
    tokenizerConfigSource: ResourceSource;
  };
  /**
   * Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
   */
  preventLoad?: boolean;
}): LLMType => {
  const [token, setToken] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<null | RnExecutorchError>(null);

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
        setError(parseUnknownError(e));
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
      generationConfig,
    }: LLMConfig) =>
      controllerInstance.configure({
        chatConfig,
        toolsConfig,
        generationConfig,
      }),
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

  return {
    messageHistory,
    response,
    token,
    isReady,
    isGenerating,
    downloadProgress,
    error,
    getGeneratedTokenCount: getGeneratedTokenCount,
    configure: configure,
    generate: generate,
    sendMessage: sendMessage,
    deleteMessage: deleteMessage,
    interrupt: interrupt,
  };
};
