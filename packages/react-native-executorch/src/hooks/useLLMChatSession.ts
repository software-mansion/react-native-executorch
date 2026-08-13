import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createLLMChatSession,
  type Modality,
  type LLMModel,
  type LLMChatSessionOptions,
} from '../extensions/llm/tasks/llmChatSession';

/**
 * React hook to load and run an LLM chat session model.
 *
 * This hook manages downloading (if they are remote URLs) and loading the `.pte` model
 * file, `tokenizer.json`, and `tokenizer_config.json`, tracking download progress and errors,
 * and cleaning up native memory when the component unmounts or configuration changes.
 * @category Hooks
 * @param config The LLM model configuration.
 * @param options Chat session options and load/caching options. See {@link ResourceOptions}.
 * @returns An object containing the session's loading state, error, download progress,
 * and chat functions.
 */
export function useLLMChatSession<M extends Modality = never>(
  config: LLMModel<M>,
  options?: LLMChatSessionOptions<M> & ResourceOptions
) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model: session, error } = useModel(
    (res) => createLLMChatSession(res, options),
    resource ?? null
  );

  return {
    isReady: !!session,
    error: downloadError || error,
    downloadProgress,
    resource,
    sendMessage: session?.sendMessage,
    getHistory: session?.getHistory,
    stop: session?.stop,
  };
}
