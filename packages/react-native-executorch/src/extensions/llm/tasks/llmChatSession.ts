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
  createChatPreprocessor,
  type ChatMediaInput,
  type ChatMessageContent,
  type ChatMessage,
  type LLMImagePreprocessorConfig,
  type LLMAudioPreprocessorConfig,
  type LLMMediaPreprocessorConfig,
} from '../chatPreprocessor';

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

/**
 * Model configuration required to instantiate an LLM chat session.
 * @category Types
 */
export type LLMModel = {
  /** Local path or remote URL of the `.pte` model file. */
  readonly modelPath: string;
  /** Local path or remote URL of the `tokenizer.json` file. */
  readonly tokenizerPath: string;
  /** Local path or remote URL of the `tokenizer_config.json` file. */
  readonly tokenizerConfigPath: string;
  /** Supported input non-text modalities (e.g. `['image']`). */
  readonly modalities?: readonly Modality[];
  /** Media preprocessor configuration. */
  readonly preprocessorConfig?: LLMMediaPreprocessorConfig;
};

/**
 * Options for configuring an LLM chat session.
 * @category Types
 */
export type LLMChatSessionOptions = {
  /** Initial conversation history to prefill into the model KV cache. */
  readonly initialMessages?: readonly ChatMessage[];
  /** Default generation configuration options. */
  readonly generationConfig?: GenerationConfig;
};

/**
 * Generation result returned by an LLM chat turn.
 * @category Types
 */
export type LLMGenerationResult = {
  /** The generated assistant response text. */
  readonly response: ChatMessageContent;
  /** Generation performance statistics. */
  readonly stats: GenerationStats;
};

/**
 * Handle to an active LLM chat session.
 * @category Types
 */
export type LLMChatSession = {
  /**
   * Interrupts and stops any active token generation call.
   */
  stop(): void;

  /**
   * Releases native model memory and preprocessor resources.
   */
  dispose(): void;

  /**
   * Returns the read-only conversation message history.
   */
  getHistory(): readonly ChatMessage[];

  /**
   * Sends a user message or chat turn to the model and generates a response.
   * @param message Message string, media payload array, or ChatMessage object.
   * @param onToken Callback fired on the RN thread for each decoded token.
   * @param genConfig Generation options overriding session defaults.
   * @returns A promise resolving to the response and generation stats.
   */
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
    readonly eosToken: string;
    readonly onToken?: (token: string) => void;
  }
): LLMGenerationResult {
  'worklet';
  const { genConfig, eosToken, onToken } = options;

  let response = '';

  const callback = (token: string) => {
    if (token === eosToken) return;
    response += token;
    if (onToken) scheduleOnRN(onToken, token);
  };

  const stats = runner.generate(prompt, genConfig, callback);

  return { response, stats };
}

/**
 * Instantiates an LLM chat session using background thread execution.
 * @category Typescript API
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

  // Prepare chat preprocessor
  const chatPreprocessor = createChatPreprocessor({
    chatTemplate,
    bosToken,
    eosToken,
    modalities,
    preprocessorConfig,
  });

  // Prepare runner
  const history: ChatMessage[] = [];
  const runner = await wrapAsync(createLLMRunner, runtime)(modelPath, tokenizerPath, modalities);
  const prefill = wrapAsync(runner.prefill, runtime);

  // Prefill initial messages
  for (const msg of initialMessages) {
    await prefill(
      chatPreprocessor.process(msg, {
        isFirstTurn: history.length === 0,
        addGenerationPrompt: false,
      })
    );
    history.push(msg);
  }

  const stop = () => runner.stop();
  const dispose = () => {
    runner.dispose();
    chatPreprocessor.dispose();
  };

  const generateChatTurn = wrapAsync(generateChatTurnWorklet, runtime);

  const sendMessage = async (
    message: ChatMessageContent | ChatMessage,
    onToken?: (token: string) => void,
    genConfig?: GenerationConfig
  ): Promise<LLMGenerationResult> => {
    let input: ChatMessage;
    if (typeof message === 'object' && 'role' in message) {
      input = message;
    } else {
      input = { role: 'user', content: message };
    }

    const prompt = chatPreprocessor.process(input, {
      isFirstTurn: history.length === 0,
      addGenerationPrompt: true,
    });

    history.push(input);

    const opts = { genConfig: { ...defaultGenerationConfig, ...genConfig }, eosToken, onToken };
    const { response, stats } = await generateChatTurn(runner, prompt, opts);

    history.push({ role: 'assistant', content: response });

    return { response, stats };
  };

  return {
    stop,
    dispose,
    sendMessage,
    getHistory: () => [...history],
  };
}
