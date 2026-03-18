import { LLMController } from '../../controllers/LLMController';
import { Logger } from '../../common/Logger';
import { parseUnknownError } from '../../errors/errorUtils';
import { ResourceSource } from '../../types/common';
import {
  LLMCapability,
  LLMConfig,
  LLMModelName,
  LLMTool,
  Message,
} from '../../types/llm';

/**
 * Module for managing a Large Language Model (LLM) instance.
 * @category Typescript API
 */
export class LLMModule {
  private controller: LLMController;

  private constructor({
    tokenCallback,
    messageHistoryCallback,
  }: {
    tokenCallback?: (token: string) => void;
    messageHistoryCallback?: (messageHistory: Message[]) => void;
  } = {}) {
    this.controller = new LLMController({
      tokenCallback,
      messageHistoryCallback,
    });
  }

  /**
   * Creates an LLM instance for a built-in model.
   * @param namedSources - An object specifying the model name, model source, tokenizer source,
   *   tokenizer config source, and optional capabilities.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @param tokenCallback - Optional callback invoked on every generated token.
   * @param messageHistoryCallback - Optional callback invoked when the model finishes a response, with the full message history.
   * @returns A Promise resolving to an `LLMModule` instance.
   * @example
   * ```ts
   * import { LLMModule, LLAMA3_2_3B } from 'react-native-executorch';
   * const llm = await LLMModule.fromModelName(LLAMA3_2_3B);
   * ```
   */
  static async fromModelName(
    namedSources: {
      modelName: LLMModelName;
      modelSource: ResourceSource;
      tokenizerSource: ResourceSource;
      tokenizerConfigSource: ResourceSource;
      capabilities?: readonly LLMCapability[];
    },
    onDownloadProgress: (progress: number) => void = () => {},
    tokenCallback?: (token: string) => void,
    messageHistoryCallback?: (messageHistory: Message[]) => void
  ): Promise<LLMModule> {
    const instance = new LLMModule({ tokenCallback, messageHistoryCallback });
    try {
      await instance.controller.load({
        modelSource: namedSources.modelSource,
        tokenizerSource: namedSources.tokenizerSource,
        tokenizerConfigSource: namedSources.tokenizerConfigSource,
        onDownloadProgressCallback: onDownloadProgress,
      });
      return instance;
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Creates an LLM instance with a user-provided model binary.
   * Use this when working with a custom-exported LLM.
   * Internally uses `'custom'` as the model name for telemetry.
   *
   * ## Required model contract
   *
   * The `.pte` model binary must be exported following the
   * [ExecuTorch LLM export process](https://docs.pytorch.org/executorch/1.1/llm/export-llm.html).
   * The native runner expects the standard ExecuTorch text-generation interface — KV-cache
   * management, prefill/decode phases, and logit sampling are all handled by the runtime.
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param tokenizerSource - A fetchable resource pointing to the tokenizer JSON file.
   * @param tokenizerConfigSource - A fetchable resource pointing to the tokenizer config JSON file.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @param tokenCallback - Optional callback invoked on every generated token.
   * @param messageHistoryCallback - Optional callback invoked when the model finishes a response, with the full message history.
   * @returns A Promise resolving to an `LLMModule` instance.
   */
  static fromCustomModel(
    modelSource: ResourceSource,
    tokenizerSource: ResourceSource,
    tokenizerConfigSource: ResourceSource,
    onDownloadProgress: (progress: number) => void = () => {},
    tokenCallback?: (token: string) => void,
    messageHistoryCallback?: (messageHistory: Message[]) => void
  ): Promise<LLMModule> {
    return LLMModule.fromModelName(
      {
        modelName: 'custom' as LLMModelName,
        modelSource,
        tokenizerSource,
        tokenizerConfigSource,
      },
      onDownloadProgress,
      tokenCallback,
      messageHistoryCallback
    );
  }

  /**
   * Sets new token callback invoked on every token batch.
   * @param tokenCallback - Callback function to handle new tokens.
   */
  setTokenCallback({
    tokenCallback,
  }: {
    tokenCallback: (token: string) => void;
  }) {
    this.controller.setTokenCallback(tokenCallback);
  }

  /**
   * Configures chat and tool calling and generation settings.
   * See [Configuring the model](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useLLM#configuring-the-model) for details.
   * @param config - Configuration object containing `chatConfig`, `toolsConfig`, and `generationConfig`.
   */
  configure(config: LLMConfig) {
    this.controller.configure(config);
  }

  /**
   * Runs model inference with raw input string.
   * You need to provide entire conversation and prompt (in correct format and with special tokens!) in input string to this method.
   * It doesn't manage conversation context. It is intended for users that need access to the model itself without any wrapper.
   * If you want a simple chat with model the consider using `sendMessage`
   * @param input - Raw input string containing the prompt and conversation history.
   * @param imagePaths
   * @returns The generated response as a string.
   */
  async forward(input: string, imagePaths?: string[]): Promise<string> {
    return await this.controller.forward(input, imagePaths);
  }

  /**
   * Runs model to complete chat passed in `messages` argument. It doesn't manage conversation context.
   * For multimodal models, set `mediaPath` on user messages to include images.
   * @param messages - Array of messages representing the chat history. User messages may include a `mediaPath` field with a local image path.
   * @param tools - Optional array of tools that can be used during generation.
   * @returns The generated response as a string.
   */
  async generate(messages: Message[], tools?: LLMTool[]): Promise<string> {
    return await this.controller.generate(messages, tools);
  }

  /**
   * Method to add user message to conversation.
   * After model responds it will call `messageHistoryCallback()` containing both user message and model response.
   * It also returns them.
   * @param message - The message string to send.
   * @param media
   * @returns - Updated message history including the new user message and model response.
   */
  async sendMessage(
    message: string,
    media?: { imagePath?: string }
  ): Promise<Message[]> {
    await this.controller.sendMessage(message, media);
    return this.controller.messageHistory;
  }

  /**
   * Deletes all messages starting with message on `index` position.
   * After deletion it will call `messageHistoryCallback()` containing new history.
   * It also returns it.
   * @param index - The index of the message to delete from history.
   * @returns - Updated message history after deletion.
   */
  deleteMessage(index: number): Message[] {
    this.controller.deleteMessage(index);
    return this.controller.messageHistory;
  }

  /**
   * Interrupts model generation. It may return one more token after interrupt.
   */
  interrupt() {
    this.controller.interrupt();
  }

  /**
   * Returns the number of tokens generated in the last response.
   * @returns The count of generated tokens.
   */
  getGeneratedTokenCount(): number {
    return this.controller.getGeneratedTokenCount();
  }

  /**
   * Returns the number of prompt tokens in the last message.
   * @returns The count of prompt token.
   */
  getPromptTokensCount() {
    return this.controller.getPromptTokenCount();
  }

  /**
   * Returns the number of total tokens from the previous generation. This is a sum of prompt tokens and generated tokens.
   * @returns The count of prompt and generated tokens.
   */
  getTotalTokensCount() {
    return this.controller.getTotalTokenCount();
  }

  /**
   * Method to delete the model from memory.
   * Note you cannot delete model while it's generating.
   * You need to interrupt it first and make sure model stopped generation.
   */
  delete() {
    this.controller.delete();
  }
}
