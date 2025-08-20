import { useModule } from '../useModule';
import { ImageSegmentationModule } from '../../modules/computer_vision/ImageSegmentationModule';
import { ResourceSource } from '../../types/common';

interface Props {
  model: { modelSource: ResourceSource };
  preventLoad?: boolean;
}

export const useImageSegmentation = ({ model, preventLoad = false }: Props) =>
  useModule({
    module: ImageSegmentationModule,
    model,
    preventLoad,
  });
