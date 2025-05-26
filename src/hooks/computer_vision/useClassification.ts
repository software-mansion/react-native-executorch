import { ResourceSource } from '../../types/common';
import { useNonStaticModule } from '../useNonStaticModule';
import { ClassificationModule } from '../../modules/computer_vision/ClassificationModule';

interface Props {
  modelSource: ResourceSource;
  preventLoad?: boolean;
}

export const useClassification = ({
  modelSource,
  preventLoad = false,
}: Props) =>
  useNonStaticModule({
    module: ClassificationModule,
    loadArgs: [modelSource],
    preventLoad: preventLoad,
  });
