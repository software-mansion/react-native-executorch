import { useState } from 'react';
import { _StyleTransferModule } from '../../native/RnExecutorchModules';
import { useModule } from '../useModule';

interface Props {
  modelSource: string | number;
}

export const useStyleTransfer = ({
  modelSource,
}: Props): {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  forward: (input: string) => Promise<string>;
} => {
  const [module, _] = useState(() => new _StyleTransferModule());
  const {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    forwardImage: forward,
  } = useModule({
    modelSource,
    module,
  });

  return { error, isReady, isGenerating, downloadProgress, forward };
};
