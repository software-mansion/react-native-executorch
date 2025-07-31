import { useNonStaticModule } from '../useNonStaticModule';
import { ImageSegmentationModule } from '../../modules/computer_vision/ImageSegmentationModule';
import { ResourceSource } from '../../types/common';

interface Props {
  model: { modelSource: ResourceSource };
  preventLoad?: boolean;
}

export const useImageSegmentation = ({ model, preventLoad = false }: Props) =>
  useNonStaticModule({
    module: ImageSegmentationModule,
    model,
    preventLoad,
  });
