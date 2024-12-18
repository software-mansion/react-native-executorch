import { useState } from 'react';
import { _StyleTransferModule } from '../native/RnExecutorchModules';
import { useModule } from '../useModule';

interface Props {
  modelSource: string | number;
}

interface StyleTransferModule {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  forward: (input: string) => Promise<string>;
}

export const useStyleTransfer = ({
  modelSource,
}: Props): StyleTransferModule => {
  const [module, _] = useState(() => new _StyleTransferModule());
  const {
    error,
    isReady,
    isGenerating,
    forwardImage: forward,
  } = useModule({
    modelSource,
    module,
  });

  return { error, isReady, isGenerating, forward };
};
