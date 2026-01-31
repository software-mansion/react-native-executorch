import { TextEmbeddingsModule } from '../../modules/natural_language_processing/TextEmbeddingsModule';
import { useModule } from '../useModule';
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
}: TextEmbeddingsProps): TextEmbeddingsType =>
  useModule({
    module: TextEmbeddingsModule,
    model,
    preventLoad,
  });
