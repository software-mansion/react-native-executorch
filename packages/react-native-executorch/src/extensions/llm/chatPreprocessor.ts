import { Template } from '@huggingface/jinja';

import { tensor, type Tensor } from '../../core/tensor';
import { RnExecuTorchError } from '../../core/error';
import type { ImageBuffer } from '../cv';
import { createImagePreprocessor, type ImagePreprocessorOptions } from '../cv/tasks/preprocessing';
import type { Modality, Prompt, MediaInput } from './llmRunner';

/**
 * High-level media payload input for chat turns.
 * @category Types
 */
export type ChatMediaInput =
  | { readonly kind: 'image'; readonly image: ImageBuffer }
  | { readonly kind: 'audio'; readonly audio: unknown };

/**
 * Interleaved text and media content for a chat turn.
 * @category Types
 */
export type ChatMessageContent = string | readonly (string | ChatMediaInput)[];

/**
 * Conversation turn representing system, user, or assistant messages.
 * @category Types
 */
export type ChatMessage = {
  /** Conversation role ('system', 'user', or 'assistant'). */
  readonly role: 'system' | 'user' | 'assistant';
  /** Message content string or interleaved text and media payloads. */
  readonly content: ChatMessageContent;
};

/**
 * Sentinel token delimiters framing media placeholders in chat templates.
 * @category Types
 */
export type LLMMediaTokenConfig = {
  /** Opening token delimiter (e.g. `<|image_start|>`). */
  readonly start: string;
  /** Closing token delimiter (e.g. `<|image_end|>`). */
  readonly end: string;
};

/**
 * Image preprocessing and sentinel token config for vision-language LLMs.
 * @category Types
 */
export type LLMImagePreprocessorConfig = {
  /** Sentinel token delimiters inserted into Jinja prompts. */
  readonly token: LLMMediaTokenConfig;
  /** Image preprocessing options (normalization, resize mode, interpolation). */
  readonly preprocessorOpts: ImagePreprocessorOptions;
  /** Fixed target shape expected by native LLM `[C, H, W]`. */
  readonly targetShape: readonly [number, number, number];
};

/**
 * Audio preprocessing and sentinel token config for audio-language LLMs.
 * @category Types
 */
export type LLMAudioPreprocessorConfig = {
  /** Sentinel token delimiters inserted into Jinja prompts. */
  readonly token: LLMMediaTokenConfig;
};

/**
 * Preprocessor configuration for media modalities.
 * @category Types
 */
export type LLMMediaPreprocessorConfig = {
  readonly image?: LLMImagePreprocessorConfig;
  readonly audio?: LLMAudioPreprocessorConfig;
};

/**
 * Options for instantiating a ChatPreprocessor.
 * @category Types
 */
export type ChatPreprocessorConfig = {
  readonly chatTemplate: string;
  readonly bosToken?: string;
  readonly modalities?: readonly Modality[];
  readonly preprocessorConfig?: LLMMediaPreprocessorConfig;
};

/**
 * Turn preprocessing options for ChatPreprocessor.
 * @category Types
 */
export type ChatProcessOptions = {
  /**
   * Whether this is the initial turn in the conversation (prepends BOS token if
   * true). Defaults to `false`.
   */
  readonly isFirstTurn?: boolean;
  /**
   * Whether to append the assistant generation prompt (e.g.
   * `<|im_start|>assistant\n`). Defaults to `true`.
   */
  readonly addGenerationPrompt?: boolean;
};

/**
 * Handles Jinja template formatting and media tensor preprocessing for chat turns.
 * @category Typescript API
 * @param config Preprocessor configuration including template and preprocessor settings.
 * @returns Object with process and dispose methods.
 */
export function createChatPreprocessor(config: ChatPreprocessorConfig) {
  const { chatTemplate, modalities, preprocessorConfig, bosToken = '' } = config;
  const template = new Template(chatTemplate);

  let imgPreprocessor: ReturnType<typeof createImagePreprocessor> | undefined;
  let imgShape: [number, number, number] | undefined;

  if (preprocessorConfig !== undefined && preprocessorConfig.image !== undefined) {
    imgShape = [...preprocessorConfig.image.targetShape];
    imgPreprocessor = createImagePreprocessor(preprocessorConfig.image.preprocessorOpts, imgShape);
  }

  const tensors: Tensor[] = [];

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    imgPreprocessor?.dispose();
  };

  const process = (message: ChatMessage, opts?: ChatProcessOptions): Prompt => {
    'worklet';
    const isFirstTurn = opts?.isFirstTurn ?? false;
    const addGenerationPrompt = opts?.addGenerationPrompt ?? true;

    if (typeof message.content === 'string') {
      /* eslint-disable camelcase */
      return template.render({
        bos_token: isFirstTurn ? bosToken : '',
        add_generation_prompt: addGenerationPrompt,
        messages: [{ role: message.role, content: message.content }],
      });
      /* eslint-enable */
    }

    const mediaInputs: MediaInput[] = [];
    let syntheticContent = '';

    for (const item of message.content) {
      if (typeof item === 'string') {
        syntheticContent += item;
        continue;
      }

      if (!modalities || !modalities.includes(item.kind)) {
        throw RnExecuTorchError(
          'INVALID_ARGUMENT',
          `Modality '${item.kind}' is not supported by this model instance.`
        );
      }

      if (item.kind === 'image' && 'image' in item) {
        if (!preprocessorConfig?.image || !imgPreprocessor || !imgShape) {
          throw RnExecuTorchError(
            'INVALID_ARGUMENT',
            'Received image input but no image preprocessorConfig was provided.'
          );
        }
        const tokenStart = preprocessorConfig.image.token.start;
        const tokenEnd = preprocessorConfig.image.token.end;
        const index = mediaInputs.length;

        syntheticContent += `${tokenStart}\uFFFC__ET_MEDIA_${index}__${tokenEnd}`;

        const tImage = tensor('float32', imgShape);
        tensors.push(tImage);
        imgPreprocessor.process(item.image).copyTo(tImage);

        mediaInputs.push({ kind: 'image', image: tImage });
      }

      if (item.kind === 'audio' && 'audio' in item) {
        throw RnExecuTorchError('INVALID_ARGUMENT', 'Audio input not yet supported');
      }
    }

    /* eslint-disable camelcase */
    const renderedContent = template.render({
      bos_token: isFirstTurn ? bosToken : '',
      add_generation_prompt: addGenerationPrompt,
      messages: [{ role: message.role, content: syntheticContent }],
    });
    /* eslint-enable */

    const regex = /\uFFFC__ET_MEDIA_(\d+)__/g;
    const prompt: (string | MediaInput)[] = [];

    let match: RegExpExecArray | null;
    let lastIndex = 0;
    while ((match = regex.exec(renderedContent)) !== null) {
      const textChunk = renderedContent.slice(lastIndex, match.index);
      if (textChunk.length > 0) prompt.push(textChunk);

      prompt.push(mediaInputs[parseInt(match[1]!, 10)]!);
      lastIndex = regex.lastIndex;
    }

    const tail = renderedContent.slice(lastIndex);
    if (tail.length > 0) prompt.push(tail);

    return prompt;
  };

  return { dispose, process };
}
