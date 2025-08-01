import { ResourceSource } from '../../types/common';
import { useNonStaticModule } from '../useNonStaticModule';
import { ClassificationModule } from '../../modules/computer_vision/ClassificationModule';

interface Props {
  model: { modelSource: ResourceSource };
  preventLoad?: boolean;
}

export const useClassification = ({ model, preventLoad = false }: Props) =>
  useNonStaticModule({
    module: ClassificationModule,
    model,
    preventLoad: preventLoad,
  });
