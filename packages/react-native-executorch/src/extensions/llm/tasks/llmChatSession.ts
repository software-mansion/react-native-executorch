/**
 * Multi-turn LLM chat session with history management, tool calling, and KV
 * cache prefilling.
 * @module LLM/Tasks/LLMChatSession
 */

import { scheduleOnRN, type WorkletRuntime } from 'react-native-worklets';
import RNBlobUtil from 'react-native-blob-util';

import { wrapAsync } from '../../../core/runtime';
import {
  createLLMRunner,
  type LLMRunner,
  type LLMKVCacheState,
  type LLMGenerationConfig,
  type LLMGenerationStats,
  type Modality,
  type Prompt,
} from '../llmRunner';
import { parseTokenizerConfig } from '../utils/tokenizerConfig';
import {
  createChatPreprocessor,
  type ChatMediaInput,
  type ChatMessageContent,
  type ChatMessage,
  type LLMImagePreprocessorConfig,
  type LLMAudioPreprocessorConfig,
  type LLMMediaPreprocessorConfig,
} from '../utils/chatPreprocessor';
import type { ToolDefinition, ToolCall, ToolParser, ToolParserResult } from '../utils/toolCalling';

export type {
  LLMKVCacheState,
  LLMGenerationConfig,
  LLMGenerationStats,
  Modality,
  ChatMediaInput,
  ChatMessageContent,
  ChatMessage,
  LLMImagePreprocessorConfig,
  LLMAudioPreprocessorConfig,
  LLMMediaPreprocessorConfig,
  ToolDefinition,
  ToolCall,
  ToolParser,
  ToolParserResult,
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
 * Configuration options for tool calling in an LLM chat session.
 * @category Types
 */
export type LLMToolOpts = {
  /** Tool definitions available to the model. */
  readonly tools: readonly ToolDefinition[];
  /** Parser function to extract tool calls from generated output. */
  readonly parseToolCalls: ToolParser;
  /** Maximum consecutive tool execution turns to prevent runaway loops. Defaults to `5`. */
  readonly maxToolTurns?: number;
};

/**
 * Options for configuring an LLM chat session.
 * @category Types
 */
export type LLMChatSessionOptions = {
  /** Default generation configuration options. */
  readonly generationConfig?: LLMGenerationConfig;
  /** Initial conversation history to prefill into the model KV cache. */
  readonly initialMessages?: readonly ChatMessage[];
  /** Optional regex pattern used to stop generation early when matched. */
  readonly stopRegex?: RegExp;
  /** Tool calling configuration options. */
  readonly toolOpts?: LLMToolOpts;
  /**
   * When true, disables append-only KV cache diffing and resets/prefills the
   * runner on every turn. Defaults to `false`.
   */
  readonly resetOnTurn?: boolean;
};

/**
 * Result returned by an LLM chat turn.
 * @category Types
 */
export type LLMChatTurnResult = {
  /** The messages added to history during this chat turn. */
  readonly messages: readonly ChatMessage[];
  /** Generation performance statistics for each generation step in this turn. */
  readonly stats: readonly LLMGenerationStats[];
  /**
   * Reason why the chat turn completed.
   * - `stop`: The model completed its answer naturally without further tool calls.
   * - `maxToolTurns`: The turn was terminated because it reached `maxToolTurns`.
   */
  readonly finishReason: 'stop' | 'maxToolTurns';
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
   * Disposes native model weights, KV cache, and tokenizer runtime resources.
   */
  dispose(): void;

  /**
   * Returns a snapshot of the current message history in the session.
   */
  getHistory(): readonly ChatMessage[];

  /**
   * Returns current KV cache occupancy and total capacity statistics for the session runner.
   */
  getKVCacheState(): LLMKVCacheState;

  /**
   * Sends a user message or chat turn to the model and generates a response.
   * @param message Message string or interleaved media payload array.
   * @param onToken Callback fired on the RN thread for each decoded token.
   * @param genConfig Generation options overriding session defaults.
   * @returns A promise resolving to the generated messages and turn stats.
   */
  sendMessage(
    message: ChatMessageContent,
    onToken?: (token: string) => void,
    genConfig?: LLMGenerationConfig
  ): Promise<LLMChatTurnResult>;
};

function generateChatTurnWorklet(
  runner: LLMRunner,
  prompt: Prompt,
  options: {
    readonly genConfig: LLMGenerationConfig;
    readonly eosToken: string;
    readonly stopRegex?: RegExp;
    readonly onToken?: (token: string) => void;
  }
): { readonly response: string; readonly stats: LLMGenerationStats } {
  'worklet';
  const { genConfig, eosToken, stopRegex, onToken } = options;

  let response = '';

  const callback = (token: string) => {
    if (token === eosToken) return;
    response += token;

    if (onToken) scheduleOnRN(onToken, token);
    if (stopRegex?.test(response)) runner.stop();
  };

  const stats = runner.generate(prompt, genConfig, callback);

  return { response, stats };
}

const DEFAULT_MAX_TURNS = 5;

/**
 * Instantiates an LLM chat session using background thread execution.
 * @category Typescript API
 * @param config Model configuration containing model, tokenizer, and tokenizer config paths.
 * @param options Custom generation, tool calling, and state options.
 * @param runtime The worklet runtime thread to run native generation on.
 * @returns A Promise resolving to an LLMChatSession instance.
 */
export async function createLLMChatSession(
  config: LLMModel,
  options: LLMChatSessionOptions = {},
  runtime?: WorkletRuntime
): Promise<LLMChatSession> {
  const {
    generationConfig: defaultGenerationConfig,
    initialMessages = [],
    stopRegex,
    toolOpts,
    resetOnTurn = false,
  } = options;

  const { modelPath, tokenizerPath, tokenizerConfigPath, modalities, preprocessorConfig } = config;
  const { tools, parseToolCalls, maxToolTurns = DEFAULT_MAX_TURNS } = toolOpts ?? {};

  // Read and parse tokenizer_config.json
  const tokenizerConfigStr = await RNBlobUtil.fs.readFile(tokenizerConfigPath, 'utf8');
  const tokenizerConfig = parseTokenizerConfig(JSON.parse(tokenizerConfigStr));
  const { chatTemplate, eosToken } = tokenizerConfig;

  // Prepare chat preprocessor
  const chatPreprocessorConfig = { chatTemplate, modalities, preprocessorConfig, tools };
  const chatPreprocessor = createChatPreprocessor(chatPreprocessorConfig);

  // Prepare runner
  const runner = await wrapAsync(createLLMRunner, runtime)(modelPath, tokenizerPath, modalities);
  const prefill = wrapAsync(runner.prefill, runtime);

  const history: ChatMessage[] = [];

  // Tracks the number of messages in `history` whose tokens and closing
  // delimiters have been permanently prefilled and committed into the runner's KV cache.
  let committed = 0;

  // Prefill initial messages if provided
  if (initialMessages.length > 0) {
    history.push(...initialMessages);
    const prompt = chatPreprocessor.process(history, history.length, { addGenPrompt: false });
    await prefill(prompt);
    chatPreprocessor.clear();
    committed = history.length;
  }

  const dispose = () => {
    runner.dispose();
    chatPreprocessor.dispose();
  };

  const stop = () => runner.stop();

  const generateChatTurn = wrapAsync(generateChatTurnWorklet, runtime);

  const sendMessage = async (
    message: ChatMessageContent,
    onToken?: (token: string) => void,
    genConfig?: LLMGenerationConfig
  ): Promise<LLMChatTurnResult> => {
    const turnGenConfig = { ...defaultGenerationConfig, ...genConfig };
    const generationOpts = { genConfig: turnGenConfig, eosToken, stopRegex, onToken };

    const initialCommitted = committed;
    const initialPos = runner.getKVCacheState().pos;

    const turnStartIdx = history.length;
    const generationStatsList: LLMGenerationStats[] = [];

    history.push({ role: 'user', content: message });

    if (resetOnTurn) {
      runner.reset();
      committed = 0;
    }

    try {
      let prefillStartMs = Date.now();

      // Prefill newly committed messages up to current user message without generation prompt
      const toCommit = history.length - committed;
      const userPrompt = chatPreprocessor.process(history, toCommit, { addGenPrompt: false });
      await prefill(userPrompt);
      chatPreprocessor.clear();

      // Record exact position at the end of the user message (before assistant generation header)
      const posAtEndOfUser = runner.getKVCacheState().pos;
      committed = history.length;

      let finishReason: 'stop' | 'maxToolTurns' = 'maxToolTurns';

      for (let currentTurn = 0; currentTurn < maxToolTurns; ++currentTurn) {
        const uncommitted = history.length - committed;
        const prompt = chatPreprocessor.process(history, uncommitted, { addGenPrompt: true });

        const prefillDurationMs = Date.now() - prefillStartMs;

        const { response, stats } = await generateChatTurn(runner, prompt, generationOpts);
        chatPreprocessor.clear();
        generationStatsList.push({ ...stats, prefillDurationMs });

        // Always rewind KV cache back to posAtEndOfUser so next turn prefills
        // cleanly formatted message with tool outputs
        runner.reset(posAtEndOfUser);

        // Check for tool calls
        const parsedTools = parseToolCalls?.(response);

        if (!parsedTools || parsedTools.toolCalls.length === 0) {
          history.push({ role: 'assistant', content: response });
          finishReason = 'stop';
          break;
        }

        // Execute tool calls
        history.push({
          role: 'assistant',
          content: parsedTools.textContent,
          toolCalls: parsedTools.toolCalls,
        });

        for (const toolCall of parsedTools.toolCalls) {
          const tool = tools?.find((t) => t.function.name === toolCall.function.name);

          let toolContent: ChatMessageContent;
          if (!tool) {
            toolContent = `Error: Tool '${toolCall.function.name}' is not recognized or not available.`;
          } else {
            try {
              toolContent = await tool.execute(toolCall.function.arguments);
            } catch (err) {
              toolContent = `Error executing tool ${toolCall.function.name}: ${String(err)}`;
            }
          }

          history.push({
            role: 'tool',
            toolCallId: toolCall.id,
            name: toolCall.function.name,
            content: toolContent,
          });
        }

        prefillStartMs = Date.now();
      }

      // Prefill all uncommitted assistant & tool messages so KV cache contains
      // full closed conversation
      const uncommitted = history.length - committed;
      if (uncommitted > 0) {
        const prompt = chatPreprocessor.process(history, uncommitted, { addGenPrompt: false });
        await prefill(prompt);
        chatPreprocessor.clear();
        committed = history.length;
      }

      return { messages: history.slice(turnStartIdx), stats: generationStatsList, finishReason };
    } catch (err) {
      // Roll back history, KV cache, and active tensors to pre-turn state on failure
      history.length = turnStartIdx;
      committed = initialCommitted;
      runner.reset(initialPos);
      chatPreprocessor.clear();
      throw err;
    }
  };

  return {
    stop,
    dispose,
    sendMessage,
    getHistory: () => [...history],
    getKVCacheState: () => runner.getKVCacheState(),
  };
}
