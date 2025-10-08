import { ExecutorchModule } from '../../modules/general/ExecutorchModule';
import { ResourceSource } from '../../types/common';
import { useModule } from '../useModule';

interface Props {
  modelSource: ResourceSource;
  preventLoad?: boolean;
}

export const useExecutorchModule = ({
  modelSource,
  preventLoad = false,
}: Props) =>
  useModule({
    module: ExecutorchModule,
    model: modelSource,
    preventLoad,
  });
