import { Template } from '@huggingface/jinja';

import { tensor, type Tensor } from '../../core/tensor';
import { RnExecuTorchError } from '../../core/error';
import type { ImageBuffer } from '../cv';
import { createImagePreprocessor, type ImagePreprocessorOptions } from '../cv/tasks/preprocessing';
import type { Modality, Prompt, MediaInput } from './llmRunner';

/** Map of supported non-text media input modalities to high-level payloads. */
export type ChatMediaInputMap = {
  /** Image payload containing an uncompressed RGBA ImageBuffer. */
  image: { readonly kind: 'image'; readonly image: ImageBuffer };
  /** Audio payload containing an uncompressed audio sample array. */
  audio: { readonly kind: 'audio'; readonly audio: unknown };
};

/** Extracts high-level media payloads for allowed modalities `M`. */
export type ChatMediaInput<M extends Modality = Modality> = ChatMediaInputMap[M];

/**
 * Interleaved text and media content for a chat turn.
 * Restricts strictly to a single text string when `M` is `never`.
 */
export type ChatMessageContent<M extends Modality = never> = [M] extends [never]
  ? string
  : string | readonly (string | ChatMediaInput<M>)[];

/** Conversation turn representing system, user, or assistant messages. */
export type ChatMessage<M extends Modality = never> = {
  /** Conversation role ('system', 'user', or 'assistant'). */
  readonly role: 'system' | 'user' | 'assistant';
  /** Message content string or interleaved text and media payloads. */
  readonly content: ChatMessageContent<M>;
};

/** Sentinel token delimiters framing media placeholders in chat templates. */
export type LLMMediaTokenConfig = {
  /** Opening token delimiter (e.g. `<|image_start|>`). */
  readonly start: string;
  /** Closing token delimiter (e.g. `<|image_end|>`). */
  readonly end: string;
};

/** Image preprocessing and sentinel token config for vision-language LLMs. */
export type LLMImagePreprocessorConfig = {
  /** Sentinel token delimiters inserted into Jinja prompts. */
  readonly token: LLMMediaTokenConfig;
  /** Image preprocessing options (normalization, resize mode, interpolation). */
  readonly preprocessorOpts: ImagePreprocessorOptions;
  /** Fixed target shape expected by native LLM `[C, H, W]`. */
  readonly targetShape: readonly [number, number, number];
};

/** Audio preprocessing and sentinel token config for audio-language LLMs. */
export type LLMAudioPreprocessorConfig = {
  /** Sentinel token delimiters inserted into Jinja prompts. */
  readonly token: LLMMediaTokenConfig;
};

/** Map of modality keys to their respective LLM preprocessor configs. */
export type LLMMediaPreprocessorConfigMap = {
  image: LLMImagePreprocessorConfig;
  audio: LLMAudioPreprocessorConfig;
};

/**
 * Preprocessor configuration for enabled modalities `M`.
 * Enabled modalities in `M` are REQUIRED; un-declared modalities are FORBIDDEN.
 */
// prettier-ignore
export type LLMMediaPreprocessorConfig<M extends Modality = never> =
  Pick<LLMMediaPreprocessorConfigMap, M> & { [K in Exclude<Modality, M>]?: never };

/** Options for instantiating a ChatRenderer. */
export type ChatRendererConfig = {
  readonly chatTemplate: string;
  readonly bosToken?: string;
  readonly preprocessorConfig?: Partial<LLMMediaPreprocessorConfigMap>;
};

/** Turn rendering options for ChatRenderer. */
export type RenderOpts = {
  readonly isFirst?: boolean;
  readonly addGenPrompt?: boolean;
};

/**
 * Handles Jinja template rendering and media tensor preprocessing for chat turns.
 * @param config Renderer configuration including template and preprocessor settings.
 * @returns Object with render and dispose methods.
 */
export function createChatRenderer<M extends Modality = never>(config: ChatRendererConfig) {
  const { chatTemplate, preprocessorConfig, bosToken = '' } = config;
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

  const render = (message: ChatMessage<M>, renderOpts?: RenderOpts): Prompt<M> => {
    const isFirst = renderOpts?.isFirst ?? false;
    const addGenPrompt = renderOpts?.addGenPrompt ?? false;

    if (typeof message.content === 'string') {
      /* eslint-disable camelcase */
      return template.render({
        bos_token: isFirst ? bosToken : '',
        add_generation_prompt: addGenPrompt,
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

      if (!preprocessorConfig || !(item.kind in preprocessorConfig)) {
        throw RnExecuTorchError('INVALID_ARGUMENT', `Modality '${item.kind}' not supported`);
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
      bos_token: isFirst ? bosToken : '',
      add_generation_prompt: addGenPrompt,
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

    return prompt as unknown as Prompt<M>;
  };

  return { dispose, render };
}
