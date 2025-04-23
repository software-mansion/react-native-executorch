import { ExecutorchModule } from '../../modules/general/ExecutorchModule';
import { useModule } from '../useModule';

interface Props {
  modelSource: string | number;
}

export const useExecutorchModule = ({ modelSource }: Props) =>
  useModule({ module: ExecutorchModule, loadArgs: [modelSource] });
