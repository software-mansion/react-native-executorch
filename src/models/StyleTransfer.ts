import { useState } from 'react';
import { _StyleTransferModule } from '../native/RnExecutorchModules';
import { useModule } from '../useModule';

interface Props {
  modelSource: string | number;
}

interface StyleTransferModule {
  error: string | null;
  isModelReady: boolean;
  isModelGenerating: boolean;
  forward: (input: string) => Promise<string>;
}

export const useStyleTransfer = ({
  modelSource,
}: Props): StyleTransferModule => {
  const [module, _] = useState(() => new _StyleTransferModule())
  const {error, isModelReady, isModelGenerating, forward} = useModule({modelSource, module})

  return { error, isModelReady, isModelGenerating, forward };
};
