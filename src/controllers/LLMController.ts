import { EventSubscription } from 'react-native';
import { LLM } from '../native/RnExecutorchModules';
import { LLMTool, MessageType, ResourceSource } from '../types/common';
import { ResourceFetcher } from '../utils/ResourceFetcher';
import { getError } from '../Error';
import { Template } from '@huggingface/jinja';

export class LLMController {
  private nativeModule: typeof LLM;

  // User callbacks
  // transcribe callback
  private modelDownloadProgessCallback:
    | ((downloadProgress: number) => void)
    | undefined;
  private isReadyCallback: (isReady: boolean) => void | undefined;
  private isGeneratingCallback: (isGenerating: boolean) => void | undefined;
  private errorCallback: ((error: any) => void) | undefined;

  // public API
  public isReady = false;
  public isGenerating = false;
  public onToken: EventSubscription | null = null;
  public response = '';
  public messageHistory: Array<MessageType> = [];

  constructor({
    // transcribeCallback,
    modelDownloadProgessCallback,
    isReadyCallback,
    isGeneratingCallback,
    errorCallback,
  }: {
    // transcribeCallback: (sequence: string) => void;
    modelDownloadProgessCallback?: (downloadProgress: number) => void;
    isReadyCallback?: (isReady: boolean) => void;
    isGeneratingCallback?: (isGenerating: boolean) => void;
    errorCallback?: (error: Error | undefined) => void;
  }) {
    this.modelDownloadProgessCallback = modelDownloadProgessCallback;
    this.isReadyCallback = (isReady) => {
      this.isReady = isReady;
      isReadyCallback?.(isReady);
    };
    this.isGeneratingCallback = (isGenerating) => {
      this.isGenerating = isGenerating;
      isGeneratingCallback?.(isGenerating);
    };
    this.errorCallback = errorCallback;
    this.nativeModule = LLM;
  }

  public async loadModel(
    modelSource: ResourceSource,
    tokenizerSource: ResourceSource
  ) {
    this.isReady = false;
    try {
      const tokenizerFileUri = await ResourceFetcher.fetch(tokenizerSource);
      const modelFileUri = await ResourceFetcher.fetch(
        modelSource,
        this.modelDownloadProgessCallback
      );

      await this.nativeModule.loadLLM(modelFileUri, tokenizerFileUri);
      this.isReady = true;
      this.onToken = this.nativeModule.onToken((data: string | undefined) => {
        if (!data) {
          return;
        }
        this.response += data;
      });
    } catch (e) {
      this.handleError(e);
      this.isReady = false;
    }
  }

  public deleteModel() {
    this.onToken?.remove();
    this.onToken = null;
    this.nativeModule.deleteModule();
  }

  public async runInference(input: string) {
    if (!this.isReady) {
      throw new Error('Model is not loaded!');
    }
    try {
      this.response = '';
      await this.nativeModule.runInference(input);
    } catch (e) {
      this.handleError(e);
    }
  }

  public interrupt() {
    this.nativeModule.interrupt();
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
    tools: LLMTool[],
    tokenizerConfig: any
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

const SPECIAL_TOKENS = [
  'bos_token',
  'eos_token',
  'unk_token',
  'sep_token',
  'pad_token',
  'cls_token',
  'mask_token',
];
