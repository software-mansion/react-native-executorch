import { ExecutorchModule } from '../../modules/general/ExecutorchModule';
import { ExecutorchModuleProps, ExecutorchModuleType } from '../../types/executorchModule';
import { useModule } from '../useModule';

/**
 * React hook for managing an arbitrary Executorch module instance.
 * 
 * @category Hooks
 * @param executorchModuleConfiguration - Configuration object containing `modelSource` and optional `preventLoad` flag.
 * @returns Ready to use Executorch module.
 */
export const useExecutorchModule = ({
  modelSource,
  preventLoad = false,
}: ExecutorchModuleProps): ExecutorchModuleType =>
  useModule({
    module: ExecutorchModule,
    model: modelSource,
    preventLoad,
  });
