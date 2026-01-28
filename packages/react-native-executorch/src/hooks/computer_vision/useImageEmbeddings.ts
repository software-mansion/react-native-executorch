import { ImageEmbeddingsModule } from '../../modules/computer_vision/ImageEmbeddingsModule';
import { ImageEmbeddingsProps } from '../../types/imageEmbeddings';
import { useModule } from '../useModule';

/**
 * React hook for managing an Image Embeddings model instance.
 * 
 * @category Hooks
 * @param ImageEmbeddingsConfiguration - Configuration object containing `model` source and optional `preventLoad` flag.
 * @returns Ready to use Image Embeddings model.
 */
export const useImageEmbeddings = ({ model, preventLoad = false }: ImageEmbeddingsProps) =>
  useModule({
    module: ImageEmbeddingsModule,
    model,
    preventLoad,
  });
