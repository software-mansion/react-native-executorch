import { TextEmbeddingsModule } from '../../modules/natural_language_processing/TextEmbeddingsModule';
import { ResourceSource } from '../../types/common';
import { useNonStaticModule } from '../useNonStaticModule';

interface Props {
  model: {
    modelSource: ResourceSource;
    tokenizerSource: ResourceSource;
  };
  preventLoad?: boolean;
}

export const useTextEmbeddings = ({ model, preventLoad = false }: Props) =>
  useNonStaticModule({
    module: TextEmbeddingsModule,
    model,
    preventLoad,
  });
