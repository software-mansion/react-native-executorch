import { LLMController } from '../../controllers/LLMController';
import { ResourceSource } from '../../types/common';
import { ChatConfig, LLMTool, Message, ToolsConfig } from '../../types/llm';

export class LLMModule {
  static controller: LLMController;

  static async load({
    modelSource,
    tokenizerSource,
    tokenizerConfigSource,
    onDownloadProgressCallback,
    tokenCallback,
    responseCallback,
    messageHistoryCallback,
  }: {
    modelSource: ResourceSource;
    tokenizerSource: ResourceSource;
    tokenizerConfigSource: ResourceSource;
    onDownloadProgressCallback?: (_downloadProgress: number) => void;
    tokenCallback?: (token: string) => void;
    responseCallback?: (response: string) => void;
    messageHistoryCallback?: (messageHistory: Message[]) => void;
  }) {
    this.controller = new LLMController({
      tokenCallback: tokenCallback,
      responseCallback: responseCallback,
      messageHistoryCallback: messageHistoryCallback,
      onDownloadProgressCallback: onDownloadProgressCallback,
    });
    await this.controller.load({
      modelSource,
      tokenizerSource,
      tokenizerConfigSource,
    });
  }

  static setTokenCallback({
    tokenCallback,
  }: {
    tokenCallback: (token: string) => void;
  }) {
    this.controller.setTokenCallback(tokenCallback);
  }

  static configure({
    chatConfig,
    toolsConfig,
  }: {
    chatConfig?: Partial<ChatConfig>;
    toolsConfig?: ToolsConfig;
  }) {
    this.controller.configure({ chatConfig, toolsConfig });
  }

  static async forward(input: string): Promise<string> {
    await this.controller.forward(input);
    return this.controller.response;
  }

  static async generate(
    messages: Message[],
    tools?: LLMTool[]
  ): Promise<string> {
    await this.controller.generate(messages, tools);
    return this.controller.response;
  }

  static async sendMessage(message: string): Promise<Message[]> {
    await this.controller.sendMessage(message);
    return this.controller.messageHistory;
  }

  static async deleteMessage(index: number): Promise<Message[]> {
    await this.controller.deleteMessage(index);
    return this.controller.messageHistory;
  }

  static interrupt() {
    this.controller.interrupt();
  }

  static delete() {
    this.controller.delete();
  }
}
