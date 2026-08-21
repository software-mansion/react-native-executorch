import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createLLMChatSession,
  type LLMModel,
  type LLMChatSessionOptions,
} from '../extensions/llm/tasks/llmChatSession';

/**
 * React hook to load and run an LLM chat session.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets and tokenizer files, tracking download progress and load errors,
 * and releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createLLMChatSession}.
 * @category Hooks
 * @param config The LLM model configuration. See {@link LLMModel}.
 * @param options Chat session options and load/caching options.
 * See {@link ResourceOptions}.
 * @returns An object containing the session's loading state, error, download
 * progress, and chat functions.
 * @see {@link createLLMChatSession}
 */
export function useLLMChatSession(
  config: LLMModel,
  options?: LLMChatSessionOptions & ResourceOptions
) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model: session, error } = useModel((res) => createLLMChatSession(res, options), resource);

  return {
    isReady: !!session,
    error: downloadError || error,
    downloadProgress,
    resource,
    sendMessage: session?.sendMessage,
    getHistory: session?.getHistory,
    getKVCacheState: session?.getKVCacheState,
    stop: session?.stop,
  };
}
