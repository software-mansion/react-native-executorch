import { TextEmbeddingsModule } from '../../modules/natural_language_processing/TextEmbeddingsModule';
import { ResourceSource } from '../../types/common';
import { useModule } from '../useModule';

/**
 * Props for the useTextEmbeddings hook.
 */
export interface Props {
  model: {
    /**
     * `ResourceSource` that specifies the location of the model binary.
     */
    modelSource: ResourceSource;

    /**
     * `ResourceSource` pointing to the JSON file which contains the tokenizer.
     */
    tokenizerSource: ResourceSource;
  };

  /**
   * Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
   */
  preventLoad?: boolean;
}

/**
 *
 * @param TextEmbeddingsConfiguration - Configuration object containing `model` source and optional `preventLoad` flag.
 * @returns - Ready to use Text Embeddings model.
 */
export const useTextEmbeddings = ({ model, preventLoad = false }: Props) =>
  useModule({
    module: TextEmbeddingsModule,
    model,
    preventLoad,
  });
