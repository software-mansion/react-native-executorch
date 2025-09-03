import { ResourceSource } from '../../types/common';
import { useModule } from '../useModule';
import { ClassificationModule } from '../../modules/computer_vision/ClassificationModule';

interface Props {
  model: { modelSource: ResourceSource };
  preventLoad?: boolean;
}

export const useClassification = ({ model, preventLoad = false }: Props) =>
  useModule({
    module: ClassificationModule,
    model,
    preventLoad: preventLoad,
  });
