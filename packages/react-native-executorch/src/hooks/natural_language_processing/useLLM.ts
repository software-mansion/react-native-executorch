import { useCallback, useEffect, useState } from 'react';
import {
  LLMCapability,
  LLMConfig,
  LLMProps,
  LLMTool,
  LLMType,
  LLMTypeMultimodal,
  Message,
} from '../../types/llm';
import { LLMController } from '../../controllers/LLMController';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

/**
 * React hook for managing a Large Language Model (LLM) instance.
 * @category Hooks
 * @param props - Object containing model, tokenizer, and tokenizer config sources.
 * @returns An object implementing the `LLMTypeMultimodal` interface when `model.capabilities` is provided, otherwise `LLMType`.
 */
export function useLLM<C extends readonly LLMCapability[]>(
  props: LLMProps & { model: { capabilities: C } }
): LLMTypeMultimodal<C>;
export function useLLM(props: LLMProps): LLMType;
export function useLLM({
  model,
  preventLoad = false,
}: LLMProps): LLMType | LLMTypeMultimodal {
  const [token, setToken] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<null | RnExecutorchError>(null);
  const capabilitiesKey = model.capabilities?.join(',') ?? '';

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
          tokenizerConfigSource: model.tokenizerConfigSource!,
          capabilities: model.capabilities,
          onDownloadProgressCallback: setDownloadProgress,
        });
      } catch (e) {
        setError(parseUnknownError(e));
      }
    })();

    return () => {
      if (controllerInstance.isReady) {
        controllerInstance.delete();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    controllerInstance,
    model.modelName,
    model.modelSource,
    model.tokenizerSource,
    model.tokenizerConfigSource,
    capabilitiesKey, // intentional: serialized string to avoid array reference re-runs
    preventLoad,
  ]);

  // memoization of returned functions
  const configure = useCallback(
    ({ chatConfig, toolsConfig, generationConfig }: LLMConfig) =>
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
    (message: string, media?: { imagePath?: string }) => {
      setResponse('');
      return controllerInstance.sendMessage(message, media);
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

  const getPromptTokenCount = useCallback(
    () => controllerInstance.getPromptTokenCount(),
    [controllerInstance]
  );

  const getTotalTokenCount = useCallback(
    () => controllerInstance.getTotalTokenCount(),
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
    getPromptTokenCount: getPromptTokenCount,
    getTotalTokenCount: getTotalTokenCount,
    configure: configure,
    generate: generate,
    sendMessage: sendMessage,
    deleteMessage: deleteMessage,
    interrupt: interrupt,
  };
}
