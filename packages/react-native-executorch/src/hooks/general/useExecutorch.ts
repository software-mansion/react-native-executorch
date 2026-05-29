import { ExecutorchModule } from '../../modules/general/ExecutorchModule';
import {
  ExecutorchModuleProps,
  ExecutorchModuleType,
} from '../../types/executorchModule';
import { TensorPtr } from '../../types/common';
import { useModuleFactory } from '../useModuleFactory';

/**
 * React hook for managing an arbitrary Executorch module instance.
 * @category Hooks
 * @param props - Configuration object containing `modelSource` and optional `preventLoad` flag.
 * @returns Ready to use Executorch module.
 */
export const useExecutorch = ({
  modelSource,
  preventLoad = false,
}: ExecutorchModuleProps): ExecutorchModuleType => {
  const { error, isReady, isGenerating, downloadProgress, runForward } =
    useModuleFactory({
      factory: (source, onProgress) =>
        ExecutorchModule.fromModelSource(source, onProgress),
      config: modelSource,
      deps: [modelSource],
      preventLoad,
    });

  const forward = (inputTensor: TensorPtr[]) =>
    runForward((inst) => inst.forward(inputTensor));

  return { error, isReady, isGenerating, downloadProgress, forward };
};
