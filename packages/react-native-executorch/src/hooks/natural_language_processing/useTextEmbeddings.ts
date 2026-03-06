import { TextEmbeddingsModule } from '../../modules/natural_language_processing/TextEmbeddingsModule';
import { useModuleFactory } from '../useModuleFactory';
import {
  TextEmbeddingsType,
  TextEmbeddingsProps,
} from '../../types/textEmbeddings';

/**
 * React hook for managing a Text Embeddings model instance.
 *
 * @category Hooks
 * @param TextEmbeddingsProps - Configuration object containing `model` source and optional `preventLoad` flag.
 * @returns Ready to use Text Embeddings model.
 */
export const useTextEmbeddings = ({
  model,
  preventLoad = false,
}: TextEmbeddingsProps): TextEmbeddingsType => {
  const { error, isReady, isGenerating, downloadProgress, runForward } =
    useModuleFactory({
      factory: (config, onProgress) =>
        TextEmbeddingsModule.fromModelName(config, onProgress),
      config: model,
      deps: [model.modelName, model.modelSource, model.tokenizerSource],
      preventLoad,
    });

  const forward = (input: string) => runForward((inst) => inst.forward(input));

  return { error, isReady, isGenerating, downloadProgress, forward };
};
