import { LLMController } from '../../controllers/LLMController';
import { ResourceSource } from '../../types/common';
import {
  LLMConfig,
  LLMTool,
  Message,
} from '../../types/llm';

/**
 * Module for managing a Large Language Model (LLM) instance.
 * 
 * @category Typescript API
 */
export class LLMModule {
  private controller: LLMController;

  /**
   * Creates a new instance of `LLMModule` with optional callbacks.
   * @param optionalCallbacks - Object containing optional callbacks.
   * 
   * @returns A new LLMModule instance.
   */
  constructor({
    tokenCallback,
    responseCallback,
    messageHistoryCallback,
  }: {
    /**
      * An optional function that will be called on every generated token (`string`) with that token as its only argument.
     */
    tokenCallback?: (token: string) => void;
    /**
      * An optional function that will be called on every generated token and receives the entire response (`string`), including this token. 
      * [DEPRECATED - consider using tokenCallback]
     */
    responseCallback?: (response: string) => void;
    /**
      * An optional function called on every finished message (`Message[]`). 
      * Returns the entire message history.
     */
    messageHistoryCallback?: (messageHistory: Message[]) => void;
  } = {}) {
    this.controller = new LLMController({
      tokenCallback,
      responseCallback,
      messageHistoryCallback,
    });
  }

  /**
   * Loads the LLM model and tokenizer.
   * 
   * @param model - Object containing model, tokenizer, and tokenizer config sources.
   * @param model.modelSource - `ResourceSource` that specifies the location of the model binary.
   * @param model.tokenizerSource - `ResourceSource` pointing to the JSON file which contains the tokenizer.
   * @param model.tokenizerConfigSource - `ResourceSource` pointing to the JSON file which contains the tokenizer config.
   * @param onDownloadProgressCallback - Optional callback to track download progress (value between 0 and 1).
   */
  async load(
    model: {
      modelSource: ResourceSource;
      tokenizerSource: ResourceSource;
      tokenizerConfigSource: ResourceSource;
    },
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ) {
    await this.controller.load({
      ...model,
      onDownloadProgressCallback,
    });
  }

  /**
   * Sets new token callback invoked on every token batch.
   * 
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
  * See [Configuring the model](../../03-hooks/01-natural-language-processing/useLLM.md#configuring-the-model) for details.
  * 
  * @param configuration - Configuration object containing `chatConfig`, `toolsConfig`, and `generationConfig`.
  */ 
  configure({
    chatConfig,
    toolsConfig,
    generationConfig,
  }: LLMConfig) {
    this.controller.configure({ chatConfig, toolsConfig, generationConfig });
  }

  /**
   * Runs model inference with raw input string.
   * You need to provide entire conversation and prompt (in correct format and with special tokens!) in input string to this method.
   * It doesn't manage conversation context. It is intended for users that need access to the model itself without any wrapper.
   * If you want a simple chat with model the consider using `sendMessage`
   * 
   * @param input - Raw input string containing the prompt and conversation history.
   * @returns The generated response as a string.
   */
  async forward(input: string): Promise<string> {
    await this.controller.forward(input);
    return this.controller.response;
  }

  /**
   * Runs model to complete chat passed in `messages` argument. It doesn't manage conversation context.
   * 
   * @param messages - Array of messages representing the chat history.
   * @param tools - Optional array of tools that can be used during generation.
   * @returns The generated response as a string.
   */
  async generate(messages: Message[], tools?: LLMTool[]): Promise<string> {
    await this.controller.generate(messages, tools);
    return this.controller.response;
  }

  /**
   * Method to add user message to conversation. 
   * After model responds it will call `messageHistoryCallback()` containing both user message and model response. 
   * It also returns them.
   * 
   * @param message - The message string to send.
   * @returns - Updated message history including the new user message and model response.
   */
  async sendMessage(message: string): Promise<Message[]> {
    await this.controller.sendMessage(message);
    return this.controller.messageHistory;
  }

  /**
   * Deletes all messages starting with message on `index` position. 
   * After deletion it will call `messageHistoryCallback()` containing new history.
   * It also returns it.
   * 
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
   * 
   * @returns The count of generated tokens.
   */
  getGeneratedTokenCount(): number {
    return this.controller.getGeneratedTokenCount();
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
