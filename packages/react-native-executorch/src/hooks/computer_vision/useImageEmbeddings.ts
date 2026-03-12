import { ImageEmbeddingsModule } from '../../modules/computer_vision/ImageEmbeddingsModule';
import {
  ImageEmbeddingsProps,
  ImageEmbeddingsType,
} from '../../types/imageEmbeddings';
import { useModuleFactory } from '../useModuleFactory';

/**
 * React hook for managing an Image Embeddings model instance.
 *
 * @category Hooks
 * @param props - Configuration object containing `model` source and optional `preventLoad` flag.
 * @returns Ready to use Image Embeddings model.
 */
export const useImageEmbeddings = ({
  model,
  preventLoad = false,
}: ImageEmbeddingsProps): ImageEmbeddingsType => {
  const { error, isReady, isGenerating, downloadProgress, runForward } =
    useModuleFactory({
      factory: (config, onProgress) =>
        ImageEmbeddingsModule.fromModelName(config, onProgress),
      config: model,
      deps: [model.modelName, model.modelSource],
      preventLoad,
    });

  const forward = (imageSource: string) =>
    runForward((inst) => inst.forward(imageSource));

  return { error, isReady, isGenerating, downloadProgress, forward };
};
