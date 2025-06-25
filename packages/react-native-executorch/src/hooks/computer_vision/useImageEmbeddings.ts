import { ImageEmbeddingsModule } from '../../modules/computer_vision/ImageEmbeddingsModule';
import { ResourceSource } from '../../types/common';
import { useNonStaticModule } from '../useNonStaticModule';

export const useImageEmbeddings = ({
  modelSource,
  preventLoad = false,
}: {
  modelSource: ResourceSource;
  preventLoad?: boolean;
}) =>
  useNonStaticModule({
    module: ImageEmbeddingsModule,
    loadArgs: [modelSource],
    preventLoad,
  });
