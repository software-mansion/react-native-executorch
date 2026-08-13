import { scheduleOnRN, type WorkletRuntime } from 'react-native-worklets';
import RNBlobUtil from 'react-native-blob-util';

import { wrapAsync } from '../../../core/runtime';
import {
  createLLMRunner,
  type LLMRunner,
  type GenerationConfig,
  type GenerationStats,
  type Modality,
  type Prompt,
} from '../llmRunner';
import { parseTokenizerConfig } from '../tokenizerConfig';
import {
  createChatRenderer,
  type ChatMediaInput,
  type ChatMessageContent,
  type ChatMessage,
  type LLMImagePreprocessorConfig,
  type LLMAudioPreprocessorConfig,
  type LLMMediaPreprocessorConfig,
} from '../chatRenderer';

export type {
  GenerationConfig,
  GenerationStats,
  Modality,
  ChatMediaInput,
  ChatMessageContent,
  ChatMessage,
  LLMImagePreprocessorConfig,
  LLMAudioPreprocessorConfig,
  LLMMediaPreprocessorConfig,
};

export type LLMModel = {
  readonly modelPath: string;
  readonly tokenizerPath: string;
  readonly tokenizerConfigPath: string;
  readonly modalities?: readonly Modality[];
  readonly preprocessorConfig?: LLMMediaPreprocessorConfig;
};

export type LLMChatSessionOptions = {
  readonly initialMessages?: readonly ChatMessage[];
  readonly generationConfig?: GenerationConfig;
  readonly stopTokens?: readonly string[];
};

export type LLMGenerationResult = {
  readonly response: ChatMessageContent;
  readonly stats: GenerationStats;
};

export type LLMChatSession = {
  stop(): void;
  dispose(): void;
  getHistory(): readonly ChatMessage[];
  sendMessage(
    message: ChatMessageContent | ChatMessage,
    onToken?: (token: string) => void,
    genConfig?: GenerationConfig
  ): Promise<LLMGenerationResult>;
};

function generateChatTurnWorklet(
  runner: LLMRunner,
  prompt: Prompt,
  options: {
    readonly genConfig: GenerationConfig;
    readonly stopTokens: readonly string[];
    readonly onToken?: (token: string) => void;
  }
): LLMGenerationResult {
  'worklet';
  const { genConfig, stopTokens, onToken } = options;

  let response = '';

  const callback = (token: string) => {
    if (stopTokens.includes(token)) return;
    response += token;
    if (onToken) scheduleOnRN(onToken, token);
  };

  const stats = runner.generate(prompt, genConfig, callback);

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
  const { modelPath, tokenizerPath, tokenizerConfigPath, modalities, preprocessorConfig } = config;

  const initialMessages = options?.initialMessages ?? [];
  const defaultGenerationConfig = options?.generationConfig;

  // Read and parse tokenizer_config.json
  const tokenizerConfigStr = await RNBlobUtil.fs.readFile(tokenizerConfigPath, 'utf8');
  const tokenizerConfig = parseTokenizerConfig(JSON.parse(tokenizerConfigStr));
  const { chatTemplate, bosToken, eosToken } = tokenizerConfig;

  // Prepare messages' renderer
  const renderer = createChatRenderer({ chatTemplate, bosToken, modalities, preprocessorConfig });
  const stopTokens = [...(options?.stopTokens ?? []), ...(eosToken ? [eosToken] : [])];

  // Prepare runner
  const history: ChatMessage[] = [];
  const runner = await wrapAsync(createLLMRunner, runtime)(modelPath, tokenizerPath, modalities);
  const prefill = wrapAsync(runner.prefill, runtime);

  // Prefill initial messages
  for (const msg of initialMessages) {
    await prefill(renderer.render(msg, { isFirst: history.length === 0 }));
    history.push(msg);
  }

  const stop = () => runner.stop();
  const dispose = () => {
    runner.dispose();
    renderer.dispose();
  };

  const generateChatTurn = wrapAsync(generateChatTurnWorklet, runtime);

  const sendMessage = async (
    message: ChatMessageContent | ChatMessage,
    onToken?: (token: string) => void,
    genConfig?: GenerationConfig
  ): Promise<LLMGenerationResult> => {
    let msg: ChatMessage;
    if (typeof message === 'object' && 'role' in message) {
      msg = message;
    } else {
      msg = { role: 'user', content: message };
    }

    const prompt = renderer.render(msg, { isFirst: history.length === 0, addGenPrompt: true });

    history.push(msg);

    const opts = { genConfig: { ...defaultGenerationConfig, ...genConfig }, stopTokens, onToken };
    const { response, stats } = await generateChatTurn(runner, prompt, opts);

    history.push({ role: 'assistant', content: response });

    return { response, stats };
  };

  return {
    stop,
    dispose,
    sendMessage,
    getHistory: () => history,
  };
}
