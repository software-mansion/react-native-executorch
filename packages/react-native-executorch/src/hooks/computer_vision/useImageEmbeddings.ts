import { ImageEmbeddingsModule } from '../../modules/computer_vision/ImageEmbeddingsModule';
import { ResourceSource } from '../../types/common';
import { useModule } from '../useModule';

interface Props {
  model: { modelSource: ResourceSource };
  preventLoad?: boolean;
}

export const useImageEmbeddings = ({ model, preventLoad = false }: Props) =>
  useModule({
    module: ImageEmbeddingsModule,
    model,
    preventLoad,
  });
