import { useModule } from '../useModule';
import { ImageSegmentationModule } from '../../modules/computer_vision/ImageSegmentationModule';
import { ResourceSource } from '../../types/common';

interface Props {
  modelSource: ResourceSource;
  preventLoad?: boolean;
}

export const useImageSegmentation = ({
  modelSource,
  preventLoad = false,
}: Props) =>
  useModule({
    module: ImageSegmentationModule,
    loadArgs: [modelSource],
    preventLoad,
  });
