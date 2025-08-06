import { ResourceSource } from '../../types/common';
import { useNonStaticModule } from '../useNonStaticModule';
import { ObjectDetectionModule } from '../../modules/computer_vision/ObjectDetectionModule';

interface Props {
  model: { modelSource: ResourceSource };
  preventLoad?: boolean;
}

export const useObjectDetection = ({ model, preventLoad = false }: Props) =>
  useNonStaticModule({
    module: ObjectDetectionModule,
    model,
    preventLoad: preventLoad,
  });
