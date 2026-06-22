import { TextEmbeddingsModule } from '../../modules/natural_language_processing/TextEmbeddingsModule';
import { useModuleFactory } from '../useModuleFactory';
import {
  AnyTextEmbeddingsModel,
  EmbeddingRole,
  ForwardFn,
  TextEmbeddingsType,
  TextEmbeddingsProps,
} from '../../types/textEmbeddings';

/**
 * React hook for a Text Embeddings model.
 * @category Hooks
 * @param TextEmbeddingsProps - `model` source + optional `preventLoad`.
 * @returns Ready to use embeddings model. `forward` returns the raw
 *   [numTokens, embeddingDim] result; use `toVector` for a single vector.
 *   Models with prompts require a `role` ('query' | 'document') on `forward`.
 */
export const useTextEmbeddings = <M extends AnyTextEmbeddingsModel>({
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
