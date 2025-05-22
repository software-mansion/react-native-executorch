import { ClassificationModule } from '../../modules/computer_vision/ClassificationModule';
import { ResourceSource } from '../../types/common';
import { useModule } from '../useModule';

export const useClassification = ({
  modelSource,
  preventLoad = false,
}: {
  modelSource: ResourceSource;
  preventLoad?: boolean;
}) =>
  useModule({
    module: ClassificationModule,
    loadArgs: [modelSource],
    preventLoad,
  });
