import { EventSubscription } from 'react-native';
import { ResourceSource } from '../types/common';
import { ResourceFetcher } from '../utils/ResourceFetcher';
import { ETError, getError } from '../Error';
import { Template } from '@huggingface/jinja';
import { DEFAULT_CHAT_CONFIG } from '../constants/llmDefaults';
import { readAsStringAsync } from 'expo-file-system';
import {
  ChatConfig,
  LLMTool,
  Message,
  SPECIAL_TOKENS,
  ToolsConfig,
} from '../types/llm';
import { LLMNativeModule } from '../native/RnExecutorchModules';
import { parseToolCall } from '../utils/llm';

export class LLMController {
  private nativeModule: typeof LLMNativeModule;
  private chatConfig: ChatConfig = DEFAULT_CHAT_CONFIG;
  private toolsConfig: ToolsConfig | undefined;
  private tokenizerConfig: any;
  private onToken: EventSubscription | null = null;
  private _response = '';
  private _isReady = false;
  private _isGenerating = false;
  private _messageHistory: Message[] = [];

  // User callbacks
  private responseCallback: (response: string) => void;
  private messageHistoryCallback: (messageHistory: Message[]) => void;
  private isReadyCallback: (isReady: boolean) => void;
  private isGeneratingCallback: (isGenerating: boolean) => void;
  private onDownloadProgressCallback:
    | ((downloadProgress: number) => void)
    | undefined;
  private errorCallback: ((error: any) => void) | undefined;

  constructor({
    responseCallback,
    messageHistoryCallback,
    isReadyCallback,
    isGeneratingCallback,
    onDownloadProgressCallback,
    errorCallback,
  }: {
    responseCallback?: (response: string) => void;
    messageHistoryCallback?: (messageHistory: Message[]) => void;
    isReadyCallback?: (isReady: boolean) => void;
    isGeneratingCallback?: (isGenerating: boolean) => void;
    onDownloadProgressCallback?: (downloadProgress: number) => void;
    errorCallback?: (error: Error | undefined) => void;
  }) {
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
    this.errorCallback = errorCallback;
    this.onDownloadProgressCallback = onDownloadProgressCallback;

    this.nativeModule = LLMNativeModule;
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
  }: {
    modelSource: ResourceSource;
    tokenizerSource: ResourceSource;
    tokenizerConfigSource: ResourceSource;
  }) {
    // reset inner state when loading new model
    this.responseCallback('');
    this.messageHistoryCallback(this.chatConfig.initialMessageHistory);
    this.isGeneratingCallback(false);
    this.isReadyCallback(false);

    try {
      const tokenizerFileUri = await ResourceFetcher.fetch(tokenizerSource);
      const tokenizerConfigFileUri = await ResourceFetcher.fetch(
        tokenizerConfigSource
      );
      this.tokenizerConfig = JSON.parse(
        await readAsStringAsync('file://' + tokenizerConfigFileUri)
      );

      const modelFileUri = await ResourceFetcher.fetch(
        modelSource,
        this.onDownloadProgressCallback
      );

      await this.nativeModule.loadLLM(modelFileUri, tokenizerFileUri);
      this.isReadyCallback(true);
      this.onToken = this.nativeModule.onToken((data: string | undefined) => {
        if (!data) {
          return;
        }
        this.responseCallback(this._response + data);
      });
    } catch (e) {
      if (this.errorCallback) {
        this.errorCallback(getError(e));
      } else {
        throw new Error(getError(e));
      }
      this.isReadyCallback(false);
    }
  }

  public configure({
    chatConfig,
    toolsConfig,
  }: {
    chatConfig?: Partial<ChatConfig>;
    toolsConfig?: ToolsConfig;
  }) {
    this.chatConfig = { ...DEFAULT_CHAT_CONFIG, ...chatConfig };
    this.toolsConfig = toolsConfig;

    // reset inner state when loading new configuration
    this.responseCallback('');
    this.messageHistoryCallback(this.chatConfig.initialMessageHistory);
    this.isGeneratingCallback(false);
  }

  public delete() {
    if (this._isGenerating) {
      throw new Error(
        'Model is generating! You cannot delete the model now. You need to interrupt first.'
      );
    }
    this.onToken?.remove();
    this.onToken = null;
    this.nativeModule.releaseResources();
    this.isReadyCallback(false);
    this.isGeneratingCallback(false);
  }

  public async forward(input: string) {
    if (!this._isReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    try {
      this.responseCallback('');
      this.isGeneratingCallback(true);
      await this.nativeModule.forward(input);
    } catch (e) {
      throw new Error(getError(e));
    } finally {
      this.isGeneratingCallback(false);
    }
  }

  public interrupt() {
    this.nativeModule.interrupt();
  }

  public async generate(messages: Message[], tools?: LLMTool[]) {
    if (!this._isReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }

    // Prepend a system prompt to the messages
    const messagesWithSystemPrompt = [
      { content: this.chatConfig.systemPrompt, role: 'system' },
      ...messages.slice(-this.chatConfig.contextWindowLength),
    ] as Message[];

    const renderedChat: string = this.applyChatTemplate(
      messagesWithSystemPrompt,
      this.tokenizerConfig,
      tools,
      // eslint-disable-next-line camelcase
      { tools_in_user_message: false, add_generation_prompt: true }
    );

    await this.forward(renderedChat);

    if (!this._response) {
      return;
    }

    const cleanedResponse = this._response
      .replaceAll(this.tokenizerConfig.eos_token, '')
      .replaceAll(this.tokenizerConfig.pad_token, '');
    this.responseCallback(cleanedResponse);
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
      this.responseCallback(
        this._response.replace(this.tokenizerConfig.eos_token, '')
      );
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
      SPECIAL_TOKENS.filter((key) => key in tokenizerConfig).map((key) => [
        key,
        tokenizerConfig[key],
      ])
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
