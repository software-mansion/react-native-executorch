import { EventSubscription } from 'react-native';
import { LLM } from '../native/RnExecutorchModules';
import { LLMTool, MessageType, ResourceSource } from '../types/common';
import { ResourceFetcher } from '../utils/ResourceFetcher';
import { getError } from '../Error';
import { Template } from '@huggingface/jinja';
import {
  DEFAULT_CONTEXT_WINDOW_LENGTH,
  DEFAULT_MESSAGE_HISTORY,
  DEFAULT_SYSTEM_PROMPT,
} from '../constants/llmDefaults';
import { readAsStringAsync } from 'expo-file-system';

export class LLMController {
  private nativeModule: typeof LLM;
  private chatConfig: ChatConfig;
  private tokenizerConfig: any;
  private onToken: EventSubscription | null = null;
  private _response = '';
  private _isReady = false;
  private _isGenerating = false;
  private _messageHistory: Array<MessageType> = [];

  // User callbacks
  private responseCallback: (response: string) => void;
  private messageHistoryCallback: (messageHistory: Array<MessageType>) => void;
  private modelDownloadProgressCallback:
    | ((downloadProgress: number) => void)
    | undefined;
  private isReadyCallback: (isReady: boolean) => void;
  private isGeneratingCallback: (isGenerating: boolean) => void;
  private errorCallback: ((error: any) => void) | undefined;

  constructor({
    responseCallback,
    messageHistoryCallback,
    isReadyCallback,
    isGeneratingCallback,
    modelDownloadProgressCallback,
    errorCallback,
    chatConfig = {
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      initialMessageHistory: DEFAULT_MESSAGE_HISTORY,
      contextWindowLength: DEFAULT_CONTEXT_WINDOW_LENGTH,
    },
  }: {
    responseCallback?: (response: string) => void;
    messageHistoryCallback: (messageHistory: Array<MessageType>) => void;
    isReadyCallback?: (isReady: boolean) => void;
    isGeneratingCallback?: (isGenerating: boolean) => void;
    modelDownloadProgressCallback?: (downloadProgress: number) => void;
    errorCallback?: (error: Error | undefined) => void;
    chatConfig?: ChatConfig;
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
    this.modelDownloadProgressCallback = modelDownloadProgressCallback;

    this.messageHistoryCallback(chatConfig.initialMessageHistory);
    this.chatConfig = chatConfig;
    this.nativeModule = LLM;
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

  public async loadModel(
    modelSource: ResourceSource,
    tokenizerSource: ResourceSource,
    tokenizerConfigSource: ResourceSource
  ) {
    this.isReadyCallback(false);
    try {
      const tokenizerFileUri = await ResourceFetcher.fetch(tokenizerSource);
      const tokenizerConfigFileUri = await ResourceFetcher.fetch(
        tokenizerConfigSource
      );
      this.tokenizerConfig = JSON.parse(
        await readAsStringAsync(tokenizerConfigFileUri)
      );

      const modelFileUri = await ResourceFetcher.fetch(
        modelSource,
        this.modelDownloadProgressCallback
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
      this.handleError(e);
      this.isReadyCallback(false);
    }
  }

  public deleteModel() {
    this.onToken?.remove();
    this.onToken = null;
    this.nativeModule.deleteModule();
  }

  public async runInference(input: string) {
    if (!this._isReady) {
      throw new Error('Model is not loaded!');
    }
    try {
      this.responseCallback('');
      this.isGeneratingCallback(true);
      await this.nativeModule.runInference(input);
      this.isGeneratingCallback(false);
    } catch (e) {
      this.isGeneratingCallback(false);
      this.handleError(e);
    }
  }

  public interrupt() {
    this.nativeModule.interrupt();
  }

  public async sendMessage(message: string, tools?: LLMTool[]) {
    this.messageHistoryCallback([
      ...this._messageHistory,
      { content: message, role: 'user' },
    ]);

    const messageHistoryWithPrompt: Array<MessageType> = [
      { content: this.chatConfig.systemPrompt, role: 'system' },
      ...this._messageHistory.slice(-this.chatConfig.contextWindowLength),
    ];

    const renderedChat: string = this.applyChatTemplate(
      messageHistoryWithPrompt,
      this.tokenizerConfig,
      tools
    );

    await this.runInference(renderedChat);

    if (this._response) {
      this.responseCallback(
        this._response.replace(this.tokenizerConfig.eos_token, '')
      );
      this.messageHistoryCallback([
        ...this._messageHistory,
        {
          content: this._response,
          role: 'assistant',
        },
      ]);
    }
  }

  private handleError(error: unknown) {
    if (this.errorCallback) {
      this.errorCallback(getError(error));
    } else {
      throw new Error(getError(error));
    }
  }

  private applyChatTemplate(
    messages: Array<MessageType>,
    tokenizerConfig: any,
    tools?: LLMTool[]
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
      ...specialTokens,
    });
    return result;
  }
}

export interface ChatConfig {
  initialMessageHistory: Array<MessageType>;
  contextWindowLength: number;
  systemPrompt: string;
}

export const SPECIAL_TOKENS = [
  'bos_token',
  'eos_token',
  'unk_token',
  'sep_token',
  'pad_token',
  'cls_token',
  'mask_token',
];
