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

export type LLMModel<M extends Modality = never> = {
  readonly modelPath: string;
  readonly tokenizerPath: string;
  readonly tokenizerConfigPath: string;
  readonly modalities?: readonly M[];
  readonly preprocessorConfig?: LLMMediaPreprocessorConfig<M>;
};

export type LLMChatSessionOptions<M extends Modality = never> = {
  readonly initialMessages?: readonly ChatMessage<M>[];
  readonly generationConfig?: GenerationConfig;
  readonly stopTokens?: readonly string[];
};

export type LLMGenerationResult<M extends Modality = never> = {
  readonly response: ChatMessageContent<M>;
  readonly stats: GenerationStats;
};

export type LLMChatSession<M extends Modality = never> = {
  stop(): void;
  dispose(): void;
  getHistory(): readonly ChatMessage<M>[];
  sendMessage(
    message: ChatMessageContent<M>,
    onToken?: (token: string) => void,
    genConfig?: GenerationConfig
  ): Promise<LLMGenerationResult<M>>;
};

function generateChatTurnWorklet<M extends Modality = never>(
  runner: LLMRunner<M>,
  prompt: Prompt<M>,
  options: {
    readonly genConfig: GenerationConfig;
    readonly stopTokens: readonly string[];
    readonly onToken?: (token: string) => void;
  }
): LLMGenerationResult<M> {
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
export async function createLLMChatSession<M extends Modality = never>(
  config: LLMModel<M>,
  options?: LLMChatSessionOptions<NoInfer<M>>,
  runtime?: WorkletRuntime
): Promise<LLMChatSession<M>> {
  const { modelPath, tokenizerPath, tokenizerConfigPath, modalities, preprocessorConfig } = config;

  const initialMessages = options?.initialMessages ?? [];
  const defaultGenerationConfig = options?.generationConfig;

  // Read and parse tokenizer_config.json
  const tokenizerConfigStr = await RNBlobUtil.fs.readFile(tokenizerConfigPath, 'utf8');
  const tokenizerConfig = parseTokenizerConfig(JSON.parse(tokenizerConfigStr));
  const { chatTemplate, bosToken, eosToken } = tokenizerConfig;

  // Prepare messages' renderer
  const renderer = createChatRenderer<M>({ chatTemplate, bosToken, preprocessorConfig });
  const stopTokens = [...(options?.stopTokens ?? []), ...(eosToken ? [eosToken] : [])];

  // Prepare runner
  const history: ChatMessage<M>[] = [];
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
    message: ChatMessageContent<M>,
    onToken?: (token: string) => void,
    genConfig?: GenerationConfig
  ): Promise<LLMGenerationResult<M>> => {
    const userMsg = { role: 'user' as const, content: message };
    const prompt = renderer.render(userMsg, { isFirst: history.length === 0, addGenPrompt: true });

    history.push(userMsg);

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
