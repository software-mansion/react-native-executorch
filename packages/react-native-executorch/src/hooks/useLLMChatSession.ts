import { useEffect, useState } from 'react';
import RNFS from 'react-native-fs';

import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import {
  createLLMChatSession,
  type LLMModel,
  type LLMChatSessionOptions,
  type LLMChatSessionConfig,
} from '../extensions/llm/tasks/llmChatSession';
import { parseTokenizerConfig, type TokenizerChatConfig } from '../extensions/llm/tokenizerConfig';

/**
 * Custom React hook to resolve and parse the tokenizer chat template config.
 * @category Hooks
 * @param source Remote URL or local path to the tokenizer config.
 * @param options Config options.
 * @returns Object containing parsed config, downloadProgress, and any download/parsing error.
 */
export function useTokenizerConfig(source: string, options?: { preventLoad?: boolean }) {
  const { localPath, downloadProgress, downloadError } = useResourceDownload(
    source,
    options?.preventLoad
  );
  const [config, setConfig] = useState<TokenizerChatConfig | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setConfig(null);
    setError(null);
    if (!localPath) return;

    let isMounted = true;
    RNFS.readFile(localPath, 'utf8')
      .then((text) => {
        if (isMounted) setConfig(parseTokenizerConfig(JSON.parse(text)));
      })
      .catch((e) => {
        if (isMounted) setError(e instanceof Error ? e : new Error(String(e)));
      });
    return () => {
      isMounted = false;
    };
  }, [localPath]);

  return { config, downloadProgress, error: downloadError || error };
}

/**
 * React hook to manage downloading, caching, loading, and interacting with an LLM Chat Session model.
 * @category Hooks
 * @param model Configuration defining model, tokenizer, and tokenizer template paths.
 * @param options Chat session options and preventLoad flag.
 * @returns Object containing chat session state, sendMessage function, stop function, and errors.
 */
export function useLLMChatSession(
  model: LLMModel,
  options?: LLMChatSessionOptions & { preventLoad?: boolean }
) {
  const {
    localPath: localModelPath,
    downloadProgress: modelProgress,
    downloadError: modelError,
  } = useResourceDownload(model.modelPath, options?.preventLoad);

  const { localPath: localTokenizerPath, downloadError: tokenizerError } = useResourceDownload(
    model.tokenizerPath,
    options?.preventLoad
  );

  const { config: tokenizerConfig, error: configError } = useTokenizerConfig(
    model.tokenizerConfigPath,
    { preventLoad: options?.preventLoad }
  );

  const downloadProgress = modelProgress;
  const downloadError = modelError || tokenizerError || configError;

  const sessionOptions = options
    ? {
        initialMessages: options.initialMessages,
        generationConfig: options.generationConfig,
        stopTokens: options.stopTokens,
      }
    : undefined;

  let sessionConfig: LLMChatSessionConfig | null = null;
  if (localModelPath && localTokenizerPath && tokenizerConfig)
    sessionConfig = {
      model: { modelPath: localModelPath, tokenizerPath: localTokenizerPath, tokenizerConfig },
      options: sessionOptions,
    };

  const { model: session, error: loadError } = useModel(createLLMChatSession, sessionConfig, [
    localModelPath,
    localTokenizerPath,
    tokenizerConfig,
  ]);

  return {
    isReady: !!session,
    downloadProgress,
    error: downloadError || loadError,
    localModelPath,
    localTokenizerPath,
    sendMessage: session?.sendMessage,
    getHistory: session?.getHistory,
    stop: session?.stop,
  };
}
