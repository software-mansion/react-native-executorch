import { ResourceSource } from '../types/common';
import { ResourceFetcher } from '../utils/ResourceFetcher';
import { ETError, getError } from '../Error';
import { Template } from '@huggingface/jinja';
import { DEFAULT_CHAT_CONFIG } from '../constants/llmDefaults';
import { readAsStringAsync } from 'expo-file-system';
import {
  ChatConfig,
  GenerationConfig,
  LLMTool,
  Message,
  SPECIAL_TOKENS,
  ToolsConfig,
} from '../types/llm';
import { parseToolCall } from '../utils/llm';
import { Logger } from '../common/Logger';

export class LLMController {
  private nativeModule: any;
  private chatConfig: ChatConfig = DEFAULT_CHAT_CONFIG;
  private toolsConfig: ToolsConfig | undefined;
  private tokenizerConfig: any;
  private onToken?: (token: string) => void;
  private _response = '';
  private _isReady = false;
  private _isGenerating = false;
  private _messageHistory: Message[] = [];

  // User callbacks
  private tokenCallback: (token: string) => void;
  private responseCallback: (response: string) => void;
  private messageHistoryCallback: (messageHistory: Message[]) => void;
  private isReadyCallback: (isReady: boolean) => void;
  private isGeneratingCallback: (isGenerating: boolean) => void;

  constructor({
    tokenCallback,
    responseCallback,
    messageHistoryCallback,
    isReadyCallback,
    isGeneratingCallback,
  }: {
    tokenCallback?: (token: string) => void;
    responseCallback?: (response: string) => void;
    messageHistoryCallback?: (messageHistory: Message[]) => void;
    isReadyCallback?: (isReady: boolean) => void;
    isGeneratingCallback?: (isGenerating: boolean) => void;
  }) {
    if (responseCallback !== undefined) {
      Logger.warn(
        'Passing response callback is deprecated and will be removed in 0.6.0'
      );
    }
    this.tokenCallback = (token) => {
      tokenCallback?.(token);
    };
    this.responseCallback = (response) => {
      this._response = response;
      responseCallback?.(response);
    };
    this.messageHistoryCallback = (messageHistory) => {
      this._messageHistory = messageHistory;
      messageHistoryCallback?.(messageHistory);
    };
    this.isReadyCallback = (isReady) => {
      this._isReady = isReady;
      isReadyCallback?.(isReady);
    };
    this.isGeneratingCallback = (isGenerating) => {
      this._isGenerating = isGenerating;
      isGeneratingCallback?.(isGenerating);
    };
  }

  public get response() {
    return this._response;
  }
  public get isReady() {
    return this._isReady;
  }
  public get isGenerating() {
    return this._isGenerating;
  }
  public get messageHistory() {
    return this._messageHistory;
  }

  public async load({
    modelSource,
    tokenizerSource,
    tokenizerConfigSource,
    onDownloadProgressCallback,
  }: {
    modelSource: ResourceSource;
    tokenizerSource: ResourceSource;
    tokenizerConfigSource: ResourceSource;
    onDownloadProgressCallback?: (downloadProgress: number) => void;
  }) {
    // reset inner state when loading new model
    this.responseCallback('');
    this.messageHistoryCallback(this.chatConfig.initialMessageHistory);
    this.isGeneratingCallback(false);
    this.isReadyCallback(false);

    try {
      const tokenizersPromise = ResourceFetcher.fetch(
        undefined,
        tokenizerSource,
        tokenizerConfigSource
      );

      const modelPromise = ResourceFetcher.fetch(
        onDownloadProgressCallback,
        modelSource
      );

      const [tokenizersResults, modelResult] = await Promise.all([
        tokenizersPromise,
        modelPromise,
      ]);

      const tokenizerPath = tokenizersResults?.[0];
      const tokenizerConfigPath = tokenizersResults?.[1];
      const modelPath = modelResult?.[0];

      if (!tokenizerPath || !tokenizerConfigPath || !modelPath) {
        throw new Error('Download interrupted!');
      }

      this.tokenizerConfig = JSON.parse(
        await readAsStringAsync('file://' + tokenizerConfigPath!)
      );
      this.nativeModule = global.loadLLM(modelPath, tokenizerPath);
      this.isReadyCallback(true);
      this.onToken = (data: string) => {
        if (!data) {
          return;
        }

        if (
          SPECIAL_TOKENS.EOS_TOKEN in this.tokenizerConfig &&
          data.indexOf(this.tokenizerConfig.eos_token) >= 0
        ) {
          data = data.replaceAll(this.tokenizerConfig.eos_token, '');
        }
        if (
          SPECIAL_TOKENS.PAD_TOKEN in this.tokenizerConfig &&
          data.indexOf(this.tokenizerConfig.pad_token) >= 0
        ) {
          data = data.replaceAll(this.tokenizerConfig.pad_token, '');
        }
        if (data.length === 0) {
          return;
        }

        this.tokenCallback(data);
        this.responseCallback(this._response + data);
      };
    } catch (e) {
      this.isReadyCallback(false);
      throw new Error(getError(e));
    }
  }

  public setTokenCallback(tokenCallback: (token: string) => void) {
    this.tokenCallback = tokenCallback;
  }

  public configure({
    chatConfig,
    toolsConfig,
    generationConfig,
  }: {
    chatConfig?: Partial<ChatConfig>;
    toolsConfig?: ToolsConfig;
    generationConfig?: GenerationConfig;
  }) {
    this.chatConfig = { ...DEFAULT_CHAT_CONFIG, ...chatConfig };
    this.toolsConfig = toolsConfig;

    if (generationConfig?.outputTokenBatchSize) {
      this.nativeModule.setCountInterval(generationConfig.outputTokenBatchSize);
    }
    if (generationConfig?.batchTimeInterval) {
      this.nativeModule.setTimeInterval(generationConfig.batchTimeInterval);
    }

    // reset inner state when loading new configuration
    this.responseCallback('');
    this.messageHistoryCallback(this.chatConfig.initialMessageHistory);
    this.isGeneratingCallback(false);
  }

  public delete() {
    if (this._isGenerating) {
      throw new Error(
        getError(ETError.ModelGenerating) +
          'You cannot delete the model now. You need to interrupt first.'
      );
    }
    this.onToken = () => {};
    this.nativeModule.unload();
    this.isReadyCallback(false);
    this.isGeneratingCallback(false);
  }

  public async forward(input: string) {
    if (!this._isReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    if (this._isGenerating) {
      throw new Error(getError(ETError.ModelGenerating));
    }
    try {
      this.responseCallback('');
      this.isGeneratingCallback(true);
      await this.nativeModule.generate(input, this.onToken);
    } catch (e) {
      throw new Error(getError(e));
    } finally {
      this.isGeneratingCallback(false);
    }
  }

  public interrupt() {
    this.nativeModule.interrupt();
  }

  public getGeneratedTokenCount(): number {
    return this.nativeModule.getGeneratedTokenCount();
  }

  public async generate(messages: Message[], tools?: LLMTool[]) {
    if (!this._isReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    if (messages.length === 0) {
      throw new Error(`Empty 'messages' array!`);
    }
    if (messages[0] && messages[0].role !== 'system') {
      Logger.warn(
        `You are not providing system prompt. You can pass it in the first message using { role: 'system', content: YOUR_PROMPT }. Otherwise prompt from your model's chat template will be used.`
      );
    }

    const renderedChat: string = this.applyChatTemplate(
      messages,
      this.tokenizerConfig,
      tools,
      // eslint-disable-next-line camelcase
      { tools_in_user_message: false, add_generation_prompt: true }
    );

    await this.forward(renderedChat);
  }

  public async sendMessage(message: string) {
    this.messageHistoryCallback([
      ...this._messageHistory,
      { content: message, role: 'user' },
    ]);

    const messageHistoryWithPrompt: Message[] = [
      { content: this.chatConfig.systemPrompt, role: 'system' },
      ...this._messageHistory.slice(-this.chatConfig.contextWindowLength),
    ];

    await this.generate(messageHistoryWithPrompt, this.toolsConfig?.tools);

    if (!this.toolsConfig || this.toolsConfig.displayToolCalls) {
      this.messageHistoryCallback([
        ...this._messageHistory,
        { content: this._response, role: 'assistant' },
      ]);
    }
    if (!this.toolsConfig) {
      return;
    }

    const toolCalls = parseToolCall(this._response);

    for (const toolCall of toolCalls) {
      this.toolsConfig
        .executeToolCallback(toolCall)
        .then((toolResponse: string | null) => {
          if (toolResponse) {
            this.messageHistoryCallback([
              ...this._messageHistory,
              { content: toolResponse, role: 'assistant' },
            ]);
          }
        });
    }
  }

  public deleteMessage(index: number) {
    // we delete referenced message and all messages after it
    // so the model responses that used them are deleted as well
    const newMessageHistory = this._messageHistory.slice(0, index);

    this.messageHistoryCallback(newMessageHistory);
  }

  private applyChatTemplate(
    messages: Message[],
    tokenizerConfig: any,
    tools?: LLMTool[],
    templateFlags?: Object
  ): string {
    if (!tokenizerConfig.chat_template) {
      throw Error("Tokenizer config doesn't include chat_template");
    }
    const template = new Template(tokenizerConfig.chat_template);

    const specialTokens = Object.fromEntries(
      Object.keys(SPECIAL_TOKENS)
        .filter((key) => key in tokenizerConfig)
        .map((key) => [key, tokenizerConfig[key]])
    );

    const result = template.render({
      messages,
      tools,
      ...templateFlags,
      ...specialTokens,
    });
    return result;
  }
}
