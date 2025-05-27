import { ResourceSource } from '../../types/common';
import { useModule } from '../useModule';
import { ObjectDetectionModule } from '../../modules/computer_vision/ObjectDetectionModule';

interface Props {
  modelSource: ResourceSource;
  preventLoad?: boolean;
}

export const useObjectDetection = ({
  modelSource,
  preventLoad = false,
}: Props) =>
  useModule({
    module: ObjectDetectionModule,
    loadArgs: [modelSource],
    preventLoad,
  });
