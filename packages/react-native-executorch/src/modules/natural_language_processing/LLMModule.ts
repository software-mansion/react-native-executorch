import { LLMController } from '../../controllers/LLMController';
import { ResourceSource } from '../../types/common';
import {
  ChatConfig,
  GenerationConfig,
  LLMTool,
  Message,
  ToolsConfig,
} from '../../types/llm';

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
      ...model,
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
    generationConfig,
  }: {
    chatConfig?: Partial<ChatConfig>;
    toolsConfig?: ToolsConfig;
    generationConfig?: GenerationConfig;
  }) {
    this.controller.configure({ chatConfig, toolsConfig, generationConfig });
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

  getGeneratedTokenCount() {
    return this.controller.getGeneratedTokenCount();
  }

  delete() {
    this.controller.delete();
  }
}
