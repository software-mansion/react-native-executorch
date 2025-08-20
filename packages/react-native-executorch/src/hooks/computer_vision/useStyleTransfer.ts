import { ResourceSource } from '../../types/common';
import { useModule } from '../useModule';
import { StyleTransferModule } from '../../modules/computer_vision/StyleTransferModule';

interface Props {
  model: { modelSource: ResourceSource };
  preventLoad?: boolean;
}

export const useStyleTransfer = ({ model, preventLoad = false }: Props) =>
  useModule({
    module: StyleTransferModule,
    model,
    preventLoad: preventLoad,
  });
