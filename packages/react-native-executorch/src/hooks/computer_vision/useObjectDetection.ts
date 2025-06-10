import { ResourceSource } from '../../types/common';
import { useNonStaticModule } from '../useNonStaticModule';
import { ObjectDetectionModule } from '../../modules/computer_vision/ObjectDetectionModule';

interface Props {
  modelSource: ResourceSource;
  preventLoad?: boolean;
}

export const useObjectDetection = ({
  modelSource,
  preventLoad = false,
}: Props) =>
  useNonStaticModule({
    module: ObjectDetectionModule,
    loadArgs: [modelSource],
    preventLoad: preventLoad,
  });
