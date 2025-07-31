import { ExecutorchModule } from '../../modules/general/ExecutorchModule';
import { ResourceSource } from '../../types/common';
import { useNonStaticModule } from '../useNonStaticModule';

interface Props {
  model: { modelSource: ResourceSource };
  preventLoad?: boolean;
}

export const useExecutorchModule = ({ model, preventLoad = false }: Props) =>
  useNonStaticModule({
    module: ExecutorchModule,
    model,
    preventLoad,
  });
