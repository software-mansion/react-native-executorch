import { ResourceSource } from '../../types/common';
import { useModule } from '../useModule';
import { ObjectDetectionModule } from '../../modules/computer_vision/ObjectDetectionModule';

interface Props {
  model: { modelSource: ResourceSource };
  preventLoad?: boolean;
}

export const useObjectDetection = ({ model, preventLoad = false }: Props) =>
  useModule({
    module: ObjectDetectionModule,
    model,
    preventLoad: preventLoad,
  });
