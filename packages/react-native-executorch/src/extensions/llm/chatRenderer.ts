import { Template } from '@huggingface/jinja';

import { tensor, type Tensor } from '../../core/tensor';
import { RnExecuTorchError } from '../../core/error';
import type { ImageBuffer } from '../cv';
import { createImagePreprocessor, type ImagePreprocessorOptions } from '../cv/tasks/preprocessing';
import type { Modality, Prompt, MediaInput } from './llmRunner';

/** High-level media payload types for chat messages. */
export type ChatMediaInputMap = {
  image: { readonly kind: 'image'; readonly image: ImageBuffer };
  audio: { readonly kind: 'audio'; readonly audio: unknown };
};

export type ChatMediaInput<M extends Modality = Modality> = ChatMediaInputMap[M];

/** Interleaved multimodal content for high-level ChatMessages. */
export type ChatMessageContent<M extends Modality = never> =
  | string
  | readonly (string | ChatMediaInput<M>)[];

/** Message interface for chat history and inputs. */
export type ChatMessage<M extends Modality = never> = {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: ChatMessageContent<M>;
};

export type MediaPreprocessorConfig = {
  image?: {
    readonly token: { readonly start: string; readonly end: string };
    readonly preprocessorOpts: ImagePreprocessorOptions;
    readonly targetShape: readonly [number, number, number];
  };
  audio?: {
    readonly token: { readonly start: string; readonly end: string };
  };
};

/** Options for instantiating a ChatRenderer. */
export type ChatRendererConfig = {
  readonly chatTemplate: string;
  readonly bosToken?: string;
  readonly preprocessorConfig?: MediaPreprocessorConfig;
};

/** Turn rendering options for ChatRenderer. */
export type RenderOpts = {
  readonly isFirst?: boolean;
  readonly addGenPrompt?: boolean;
};

/**
 * Handles Jinja template rendering and media tensor preprocessing for chat turns.
 * @param config Chat renderer configuration options including template and preprocessor settings.
 * @returns A ChatRenderer object with render and dispose methods.
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

    return prompt as Prompt<M>;
  };

  return { dispose, render };
}
