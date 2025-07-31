import { ImageEmbeddingsModule } from '../../modules/computer_vision/ImageEmbeddingsModule';
import { ResourceSource } from '../../types/common';
import { useNonStaticModule } from '../useNonStaticModule';

interface Props {
  model: { modelSource: ResourceSource };
  preventLoad?: boolean;
}

export const useImageEmbeddings = ({ model, preventLoad = false }: Props) =>
  useNonStaticModule({
    module: ImageEmbeddingsModule,
    model,
    preventLoad,
  });
