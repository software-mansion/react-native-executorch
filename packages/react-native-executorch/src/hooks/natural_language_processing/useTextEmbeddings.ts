import { TextEmbeddingsModule } from '../../modules/natural_language_processing/TextEmbeddingsModule';
import { useModuleFactory } from '../useModuleFactory';
import {
  EmbeddingRole,
  ForwardFn,
  TextEmbeddingsModel,
  TextEmbeddingsType,
  TextEmbeddingsProps,
} from '../../types/textEmbeddings';

/**
 * React hook for managing a Text Embeddings model instance.
 * @category Hooks
 * @param TextEmbeddingsProps - Configuration object containing `model` source and optional `preventLoad` flag.
 * @returns Ready to use Text Embeddings model. `forward` returns a
 *   `Float32Array` for pooled models and an `EmbeddingResult` (per-token
 *   vectors) for multi-vector models. Models with prompts require a `role`
 *   ('query' | 'document') on `forward`.
 */
export const useTextEmbeddings = <M extends TextEmbeddingsModel>({
  model,
  preventLoad = false,
}: TextEmbeddingsProps<M>): TextEmbeddingsType<M> => {
  const { error, isReady, isGenerating, downloadProgress, runForward } =
    useModuleFactory({
      factory: (config, onProgress) =>
        TextEmbeddingsModule.fromModelName(config, onProgress),
      config: model,
      deps: [model.modelName, model.modelSource, model.tokenizerSource],
      preventLoad,
    });

  const forward = ((input: string, role?: EmbeddingRole) =>
    runForward((inst) => inst.forward(input, role))) as ForwardFn<M>;

  return { error, isReady, isGenerating, downloadProgress, forward };
};
