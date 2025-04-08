import { ExecutorchModule } from '../../modules/general/ExecutorchModule';
import { useModule2 } from '../useModule2';

interface Props {
  modelSource: string | number;
}

export const useExecutorchModule = ({ modelSource }: Props) =>
  useModule2({ module: ExecutorchModule, loadArgs: [modelSource] });
