import { LLMController } from '../../controllers/LLMController';
import { ResourceSource } from '../../types/common';
import { ChatConfig, LLMTool, MessageType } from '../../types/llm';

export class LLMModule {
  static controller: LLMController;

  static async load({
    modelSource,
    tokenizerSource,
    tokenizerConfigSource,
    chatConfig,
    onDownloadProgressCallback,
    responseCallback,
    messageHistoryCallback,
  }: {
    modelSource: ResourceSource;
    tokenizerSource: ResourceSource;
    tokenizerConfigSource: ResourceSource;
    chatConfig?: Partial<ChatConfig>;
    onDownloadProgressCallback?: (_downloadProgress: number) => void;
    responseCallback?: (response: string) => void;
    messageHistoryCallback?: (messageHistory: MessageType[]) => void;
  }) {
    this.controller = new LLMController({
      responseCallback: responseCallback,
      messageHistoryCallback: messageHistoryCallback,
      onDownloadProgressCallback: onDownloadProgressCallback,
      chatConfig,
    });
    await this.controller.load({
      modelSource,
      tokenizerSource,
      tokenizerConfigSource,
    });
  }

  static async runInference(input: string): Promise<string> {
    await this.controller.runInference(input);
    return this.controller.response;
  }

  static async sendMessage(
    message: string,
    tools: LLMTool[]
  ): Promise<MessageType[]> {
    await this.controller.sendMessage(message, tools);
    return this.controller.messageHistory;
  }

  static interrupt() {
    this.controller.interrupt();
  }

  static delete() {
    this.controller.delete();
  }
}
