import { ResourceSource } from '../../types/common';
import { useNonStaticModule } from '../useNonStaticModule';
import { StyleTransferModule } from '../../modules/computer_vision/StyleTransferModule';

interface Props {
  model: { modelSource: ResourceSource };
  preventLoad?: boolean;
}

export const useStyleTransfer = ({ model, preventLoad = false }: Props) =>
  useNonStaticModule({
    module: StyleTransferModule,
    model,
    preventLoad: preventLoad,
  });
