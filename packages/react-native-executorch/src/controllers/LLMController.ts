import { ResourceSource } from '../types/common';
import { ResourceFetcher } from '../utils/ResourceFetcher';
import { Template } from '@huggingface/jinja';
import { DEFAULT_CHAT_CONFIG } from '../constants/llmDefaults';
import {
  ChatConfig,
  GenerationConfig,
  LLMCapability,
  LLMTool,
  Message,
  SPECIAL_TOKENS,
  ToolsConfig,
} from '../types/llm';
import { parseToolCall } from '../utils/llm';
import { Logger } from '../common/Logger';
import { RnExecutorchError, parseUnknownError } from '../errors/errorUtils';
import { RnExecutorchErrorCode } from '../errors/ErrorCodes';

export class LLMController {
  private nativeModule: any;
  private chatConfig: ChatConfig = DEFAULT_CHAT_CONFIG;
  private toolsConfig: ToolsConfig | undefined;
  private tokenizerConfig: any;
  private onToken?: (token: string) => void;
  private _isReady = false;
  private _isGenerating = false;
  private _messageHistory: Message[] = [];
  // User callbacks
  private tokenCallback: (token: string) => void;
  private messageHistoryCallback: (messageHistory: Message[]) => void;
  private isReadyCallback: (isReady: boolean) => void;
  private isGeneratingCallback: (isGenerating: boolean) => void;

  constructor({
    tokenCallback,
    messageHistoryCallback,
    isReadyCallback,
    isGeneratingCallback,
  }: {
    tokenCallback?: (token: string) => void;
    messageHistoryCallback?: (messageHistory: Message[]) => void;
    isReadyCallback?: (isReady: boolean) => void;
    isGeneratingCallback?: (isGenerating: boolean) => void;
  }) {
    this.tokenCallback = (token) => {
      tokenCallback?.(token);
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
    capabilities,
    defaultGenerationConfig,
    onDownloadProgressCallback,
  }: {
    modelSource: ResourceSource;
    tokenizerSource: ResourceSource;
    tokenizerConfigSource: ResourceSource;
    capabilities?: readonly LLMCapability[];
    defaultGenerationConfig?: GenerationConfig;
    onDownloadProgressCallback?: (downloadProgress: number) => void;
  }) {
    // reset inner state when loading new model
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
        throw new RnExecutorchError(
          RnExecutorchErrorCode.DownloadInterrupted,
          'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
        );
      }

      this.tokenizerConfig = JSON.parse(
        await ResourceFetcher.fs.readAsString(tokenizerConfigPath!)
      );

      if (this.nativeModule) {
        this.nativeModule.unload();
      }

      this.nativeModule = await global.loadLLM(
        modelPath,
        tokenizerPath,
        capabilities ?? []
      );
      if (defaultGenerationConfig) {
        // Apply model-specific recommended sampling defaults before flipping
        // isReady so callers that react to it see the right config on first
        // send. User-provided `configure()` calls still override these.
        this.applyGenerationConfig(defaultGenerationConfig);
      }
      this.isReadyCallback(true);
      this.onToken = (data: string) => {
        if (!data) {
          return;
        }

        const filtered = this.filterSpecialTokens(data);

        if (filtered.length === 0) {
          return;
        }
        this.tokenCallback(filtered);
      };
    } catch (e) {
      Logger.error('Load failed:', e);
      this.isReadyCallback(false);
      throw parseUnknownError(e);
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

    if (generationConfig) {
      this.applyGenerationConfig(generationConfig);
    }

    // reset inner state when loading new configuration
    this.messageHistoryCallback(this.chatConfig.initialMessageHistory);
    this.isGeneratingCallback(false);
  }

  private applyGenerationConfig(generationConfig: GenerationConfig) {
    if (generationConfig.outputTokenBatchSize) {
      this.nativeModule.setCountInterval(generationConfig.outputTokenBatchSize);
    }
    if (generationConfig.batchTimeInterval) {
      this.nativeModule.setTimeInterval(generationConfig.batchTimeInterval);
    }
    if (generationConfig.temperature !== undefined) {
      this.nativeModule.setTemperature(generationConfig.temperature);
    }
    // `topp` is the legacy spelling kept for backwards compatibility — `topP`
    // wins when both are set so callers migrating to the new name don't get
    // surprised by stale values. Reading the deprecated alias is intentional.
    const topP = generationConfig.topP ?? generationConfig.topp;
    if (topP !== undefined) {
      if (topP < 0 || topP > 1) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.InvalidConfig,
          'Top P has to be in range [0, 1]'
        );
      }
      this.nativeModule.setTopp(topP);
    }
    if (generationConfig.minP !== undefined) {
      if (generationConfig.minP < 0 || generationConfig.minP > 1) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.InvalidConfig,
          'Min P has to be in range [0, 1]'
        );
      }
      this.nativeModule.setMinP(generationConfig.minP);
    }
    if (generationConfig.repetitionPenalty !== undefined) {
      if (generationConfig.repetitionPenalty < 0) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.InvalidConfig,
          'Repetition penalty must be non-negative'
        );
      }
      this.nativeModule.setRepetitionPenalty(
        generationConfig.repetitionPenalty
      );
    }
  }

  private getImageToken(): string {
    const token = this.tokenizerConfig.image_token;
    if (!token) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidConfig,
        "Tokenizer config is missing 'image_token'. Vision models require tokenizerConfigSource with an 'image_token' field."
      );
    }
    return token;
  }

  private filterSpecialTokens(text: string): string {
    let filtered = text;
    if (
      SPECIAL_TOKENS.EOS_TOKEN in this.tokenizerConfig &&
      this.tokenizerConfig.eos_token
    ) {
      filtered = filtered.replaceAll(this.tokenizerConfig.eos_token, '');
    }
    if (
      SPECIAL_TOKENS.PAD_TOKEN in this.tokenizerConfig &&
      this.tokenizerConfig.pad_token
    ) {
      filtered = filtered.replaceAll(this.tokenizerConfig.pad_token, '');
    }
    return filtered;
  }

  public delete() {
    if (this._isGenerating) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModelGenerating,
        'You cannot delete the model now. You need ot interrupt it first.'
      );
    }

    this.onToken = () => {};
    if (this.nativeModule) {
      this.nativeModule.unload();
    }
    this.isReadyCallback(false);
    this.isGeneratingCallback(false);
  }

  public async forward(input: string, imagePaths?: string[]): Promise<string> {
    if (!this._isReady) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    }
    if (this._isGenerating) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModelGenerating,
        'The model is currently generating. Please wait until previous model run is complete.'
      );
    }
    try {
      this.isGeneratingCallback(true);
      this.nativeModule.reset();
      const response =
        imagePaths && imagePaths.length > 0
          ? await this.nativeModule.generateMultimodal(
              input,
              imagePaths.map(normalizeImagePath),
              this.getImageToken(),
              this.onToken
            )
          : await this.nativeModule.generate(input, this.onToken);
      return this.filterSpecialTokens(response);
    } catch (e) {
      throw parseUnknownError(e);
    } finally {
      this.isGeneratingCallback(false);
    }
  }

  public interrupt() {
    if (!this.nativeModule) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        "Cannot interrupt a model that's not loaded."
      );
    }
    this.nativeModule.interrupt();
  }

  public getGeneratedTokenCount(): number {
    if (!this.nativeModule) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        "Cannot get token count for a model that's not loaded."
      );
    }
    return this.nativeModule.getGeneratedTokenCount();
  }

  public getPromptTokenCount(): number {
    if (!this.nativeModule) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        "Cannot get prompt token count for a model that's not loaded."
      );
    }
    return this.nativeModule.getPromptTokenCount();
  }

  public getTotalTokenCount(): number {
    return this.getGeneratedTokenCount() + this.getPromptTokenCount();
  }

  public async generate(
    messages: Message[],
    tools?: LLMTool[]
  ): Promise<string> {
    if (!this._isReady) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling generate().'
      );
    }
    if (messages.length === 0) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidUserInput,
        'Messages array is empty!'
      );
    }
    if (messages[0] && messages[0].role !== 'system') {
      Logger.warn(
        `You are not providing system prompt. You can pass it in the first message using { role: 'system', content: YOUR_PROMPT }. Otherwise prompt from your model's chat template will be used.`
      );
    }

    const imagePaths = messages
      .filter((m) => m.mediaPath)
      .map((m) => m.mediaPath!);

    const renderedChat: string = this.applyChatTemplate(
      messages,
      this.tokenizerConfig,
      tools,
      // eslint-disable-next-line camelcase
      { tools_in_user_message: false, add_generation_prompt: true }
    );

    return await this.forward(
      renderedChat,
      imagePaths.length > 0 ? imagePaths : undefined
    );
  }

  public async sendMessage(
    message: string,
    media?: { imagePath?: string }
  ): Promise<string> {
    const mediaPath = media?.imagePath;
    const newMessage: Message = {
      content: message,
      role: 'user',
      ...(mediaPath ? { mediaPath } : {}),
    };
    const updatedHistory = [...this._messageHistory, newMessage];
    this.messageHistoryCallback(updatedHistory);

    const visualTokenCount = this.nativeModule.getVisualTokenCount();
    const countTokensCallback = (messages: Message[]) => {
      const rendered = this.applyChatTemplate(
        messages,
        this.tokenizerConfig,
        this.toolsConfig?.tools,
        // eslint-disable-next-line camelcase
        { tools_in_user_message: false, add_generation_prompt: true }
      );
      const textTokens = this.nativeModule.countTextTokens(rendered);
      const imageCount = messages.filter((m) => m.mediaPath).length;
      return textTokens + imageCount * (visualTokenCount - 1);
    };
    const maxContextLength = this.nativeModule.getMaxContextLength();
    const messageHistoryWithPrompt =
      this.chatConfig.contextStrategy.buildContext(
        this.chatConfig.systemPrompt,
        updatedHistory,
        maxContextLength,
        countTokensCallback
      );

    const response = await this.generate(
      messageHistoryWithPrompt,
      this.toolsConfig?.tools
    );

    if (!this.toolsConfig || this.toolsConfig.displayToolCalls) {
      this.messageHistoryCallback([
        ...this._messageHistory,
        { content: response, role: 'assistant' },
      ]);
    }

    if (this.toolsConfig) {
      const toolCalls = parseToolCall(response);
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

    return response;
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
      throw new RnExecutorchError(
        RnExecutorchErrorCode.TokenizerError,
        "Tokenizer config doesn't include chat_template"
      );
    }
    const template = new Template(tokenizerConfig.chat_template);

    const specialTokens = Object.fromEntries(
      Object.values(SPECIAL_TOKENS)
        .filter((key) => key in tokenizerConfig)
        .map((key) => [key, tokenizerConfig[key]])
    );

    const result = template.render({
      messages: messagesForChatTemplate(messages),
      tools,
      ...templateFlags,
      ...specialTokens,
    });
    return result;
  }
}

/**
 * The native multimodal pipeline expects image paths to be `file://` URIs.
 * `ResourceFetcher.fetch` and most platform file APIs return raw filesystem
 * paths without that prefix, so callers routinely pass either form. Accept
 * both and normalize to the prefixed form here.
 * @param path - Local image path, either with or without the `file://` prefix.
 * @returns The same path with a `file://` prefix.
 */
function normalizeImagePath(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

/**
 * Multimodal chat templates expect message content for image-bearing turns
 * to be an array of content parts with an `image` part as a placeholder.
 * Callers of `LLMController.generate` and `LLMController.sendMessage` pass
 * messages with a plain string `content` plus an optional `mediaPath`; this
 * helper rewrites them into the structured form that the template engine
 * understands.
 * @param messages - Messages to prepare for the chat template engine.
 * @returns Messages with image-bearing turns rewritten to structured content.
 */
function messagesForChatTemplate(messages: Message[]): any[] {
  return messages.map((m) =>
    m.mediaPath && typeof m.content === 'string'
      ? {
          ...m,
          content: [{ type: 'image' }, { type: 'text', text: m.content }],
        }
      : m
  );
}
