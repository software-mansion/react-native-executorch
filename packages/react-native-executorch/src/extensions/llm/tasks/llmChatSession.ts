import { scheduleOnRN, type WorkletRuntime } from 'react-native-worklets';
import RNBlobUtil from 'react-native-blob-util';

import { wrapAsync } from '../../../core/runtime';
import {
  createLLMRunner,
  type LLMRunner,
  type GenerationConfig,
  type GenerationStats,
  type Modality,
} from '../llmRunner';
import { createJinjaChatFormatter } from '../jinja';
import { parseTokenizerConfig } from '../tokenizerConfig';

export type { GenerationConfig, GenerationStats, Modality };

/** Message interface for chat history and inputs. */
export type ChatMessage = {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
};

/** Interface for converting a ChatMessage history turn into raw prompt text. */
export type ChatFormatter = (
  message: ChatMessage,
  options: { readonly isFirst: boolean }
) => string;

/** Model path configuration for LLM chat. */
export type LLMModel = {
  readonly modelPath: string;
  readonly tokenizerPath: string;
  readonly tokenizerConfigPath: string;
  readonly modalities?: readonly Modality[];
};

/** Custom generation and state options for an LLM chat session. */
export type LLMChatSessionOptions = {
  readonly initialMessages?: readonly ChatMessage[];
  readonly generationConfig?: GenerationConfig;
  readonly stopTokens?: readonly string[];
};

/** Return wrapper holding generated response text and performance stats. */
export type GenerationResult = {
  readonly response: string;
  readonly stats: GenerationStats;
};

/** Orchestrator interface for active LLM chat sessions. */
export type LLMChatSession = {
  dispose(): void;
  sendMessage(
    message: string,
    onToken?: (token: string) => void,
    genConfig?: GenerationConfig
  ): Promise<GenerationResult>;
  getHistory(): readonly ChatMessage[];
  stop(): void;
};

type SessionState = {
  history: ChatMessage[];
};

function generateChatTurn(
  nativeRunner: LLMRunner<any>,
  prompt: string,
  options: {
    readonly genConfig: GenerationConfig;
    readonly stopTokens: readonly string[];
    readonly onToken?: (token: string) => void;
  }
): GenerationResult {
  'worklet';
  const { genConfig, stopTokens, onToken } = options;

  let response = '';

  const callback = (token: string) => {
    if (stopTokens.includes(token)) return;
    response += token;
    if (onToken) scheduleOnRN(onToken, token);
  };

  const stats = nativeRunner.generate(prompt, genConfig, callback);

  return { response, stats };
}

/**
 * Instantiates an LLM chat session using background thread execution.
 * @param config Model configuration containing model, tokenizer, and tokenizer config paths.
 * @param options Custom generation and state options.
 * @param runtime The worklet runtime thread to run native generation on.
 * @returns A Promise resolving to an LLMChatSession instance.
 */
export async function createLLMChatSession(
  config: LLMModel,
  options?: LLMChatSessionOptions,
  runtime?: WorkletRuntime
): Promise<LLMChatSession> {
  const { modelPath, tokenizerPath, tokenizerConfigPath, modalities } = config;

  const initialMessages = options?.initialMessages ?? [];
  const defaultGenerationConfig = options?.generationConfig;

  // Read and parse tokenizer_config.json
  const configStr = await RNBlobUtil.fs.readFile(tokenizerConfigPath, 'utf8');
  const tokenizerConfig = parseTokenizerConfig(JSON.parse(configStr));
  const { chatTemplate, bosToken, eosToken } = tokenizerConfig;

  const format = createJinjaChatFormatter(chatTemplate, { bosToken });
  const stopTokens = [...(options?.stopTokens ?? []), ...(eosToken ? [eosToken] : [])];

  const state: SessionState = { history: [] };
  const nativeRunner = await wrapAsync(createLLMRunner, runtime)(
    modelPath,
    tokenizerPath,
    modalities
  );
  const prefill = wrapAsync(nativeRunner.prefill, runtime);

  for (const msg of initialMessages) {
    const fmtMsg = format(msg, { isFirst: state.history.length === 0 });
    if (fmtMsg.length > 0) {
      await prefill(fmtMsg);
    }
    state.history.push(msg);
  }

  const stop = () => nativeRunner.stop();
  const dispose = () => nativeRunner.dispose();
  const runGeneration = wrapAsync(generateChatTurn, runtime);

  const sendMessage = async (
    message: string,
    onToken?: (token: string) => void,
    genConfig?: GenerationConfig
  ): Promise<GenerationResult> => {
    const userMsg: ChatMessage = { role: 'user', content: message };
    const assistantHeader: ChatMessage = { role: 'assistant', content: '' };

    const fmtUserMsg = format(userMsg, { isFirst: state.history.length === 0 });
    const fmtAssistantHeader = format(assistantHeader, { isFirst: false });

    state.history.push(userMsg);

    const prompt = fmtUserMsg + fmtAssistantHeader;
    const { response, stats } = await runGeneration(nativeRunner, prompt, {
      genConfig: { ...defaultGenerationConfig, ...genConfig },
      stopTokens,
      onToken,
    });

    state.history.push({ role: 'assistant', content: response });

    return { response, stats };
  };

  return {
    stop,
    dispose,
    sendMessage,
    getHistory: () => state.history,
  };
}
