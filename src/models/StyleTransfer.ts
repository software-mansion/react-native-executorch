import { useState } from 'react';
import { StyleTransferModule } from '../native/RnExecutorchModules';
import { useModule } from '../useModule';

interface Props {
  modelSource: string | number;
}

interface _StyleTransferModule {
  error: string | null;
  isModelReady: boolean;
  isModelGenerating: boolean;
  forward: (input: string) => Promise<string>;
}

export const useStyleTransfer = ({
  modelSource,
}: Props): _StyleTransferModule => {
  const [_class, _] = useState(() => new StyleTransferModule())
  const {error, isModelReady, isModelGenerating, forward} = useModule({modelSource, _class})

  return { error, isModelReady, isModelGenerating, forward };
};
