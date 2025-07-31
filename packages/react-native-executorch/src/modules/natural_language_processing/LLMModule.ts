import { LLMController } from '../../controllers/LLMController';
import { ResourceSource } from '../../types/common';
import { ChatConfig, LLMTool, Message, ToolsConfig } from '../../types/llm';

export class LLMModule {
  private controller: LLMController;

  constructor({
    tokenCallback,
    responseCallback,
    messageHistoryCallback,
  }: {
    tokenCallback?: (token: string) => void;
    responseCallback?: (response: string) => void;
    messageHistoryCallback?: (messageHistory: Message[]) => void;
  } = {}) {
    this.controller = new LLMController({
      tokenCallback,
      responseCallback,
      messageHistoryCallback,
    });
  }

  async load(
    model: {
      modelSource: ResourceSource;
      tokenizerSource: ResourceSource;
      tokenizerConfigSource: ResourceSource;
    },
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ) {
    await this.controller.load({
      modelSource: model.modelSource,
      tokenizerSource: model.tokenizerSource,
      tokenizerConfigSource: model.tokenizerConfigSource,
      onDownloadProgressCallback,
    });
  }

  setTokenCallback({
    tokenCallback,
  }: {
    tokenCallback: (token: string) => void;
  }) {
    this.controller.setTokenCallback(tokenCallback);
  }

  configure({
    chatConfig,
    toolsConfig,
  }: {
    chatConfig?: Partial<ChatConfig>;
    toolsConfig?: ToolsConfig;
  }) {
    this.controller.configure({ chatConfig, toolsConfig });
  }

  async forward(input: string): Promise<string> {
    await this.controller.forward(input);
    return this.controller.response;
  }

  async generate(messages: Message[], tools?: LLMTool[]): Promise<string> {
    await this.controller.generate(messages, tools);
    return this.controller.response;
  }

  async sendMessage(message: string): Promise<Message[]> {
    await this.controller.sendMessage(message);
    return this.controller.messageHistory;
  }

  deleteMessage(index: number): Message[] {
    this.controller.deleteMessage(index);
    return this.controller.messageHistory;
  }

  interrupt() {
    this.controller.interrupt();
  }

  delete() {
    this.controller.delete();
  }
}
