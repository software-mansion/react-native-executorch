import { ExecutorchModule } from '../../modules/general/ExecutorchModule';
import { ResourceSource } from '../../types/common';
import { useNonStaticModule } from '../useNonStaticModule';

interface Props {
  modelSource: ResourceSource;
  preventLoad?: boolean;
}

export const useExecutorchModule = ({
  modelSource,
  preventLoad = false,
}: Props) =>
  useNonStaticModule({
    module: ExecutorchModule,
    model: { modelSource },
    preventLoad,
  });
