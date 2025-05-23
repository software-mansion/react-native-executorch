import { ResourceSource } from '../../types/common';
import { useModule } from '../useModule';
import { StyleTransferModule } from '../../modules/computer_vision/StyleTransferModule';

interface Props {
  modelSource: ResourceSource;
  preventLoad?: boolean;
}

export const useStyleTransfer = ({ modelSource, preventLoad = false }: Props) =>
  useModule({
    module: StyleTransferModule,
    loadArgs: [modelSource],
    preventLoad,
  });
