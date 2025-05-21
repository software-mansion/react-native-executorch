import { ResourceSource } from '../../types/common';
import { useNonStaticModule } from '../useNonStaticModule';
import { ImageSegmentationModule } from '../../modules/computer_vision/ImageSegmentationModule';

interface Props {
  modelSource: ResourceSource;
  preventLoad?: boolean;
}

export const useImageSegmentation = ({
  modelSource,
  preventLoad = false,
}: Props) =>
  useNonStaticModule({
    module: ImageSegmentationModule,
    loadArgs: [modelSource],
    preventLoad: preventLoad,
  });
