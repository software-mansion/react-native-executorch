import { TextEmbeddingsModule } from '../../modules/natural_language_processing/TextEmbeddingsModule';
import { ResourceSource } from '../../types/common';
import { useModule } from '../useModule';

interface Props {
  model: {
    modelSource: ResourceSource;
    tokenizerSource: ResourceSource;
  };
  preventLoad?: boolean;
}

export const useTextEmbeddings = ({ model, preventLoad = false }: Props) =>
  useModule({
    module: TextEmbeddingsModule,
    model,
    preventLoad,
  });
