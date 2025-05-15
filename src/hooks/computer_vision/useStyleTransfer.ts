import { ResourceSource } from '../../types/common';
import { useNonStaticModule } from '../useNonStaticModule';
import { StyleTransferModule } from '../../modules/computer_vision/StyleTransferModule';

interface Props {
  modelSource: ResourceSource;
  preventLoad?: boolean;
}

export const useStyleTransfer = ({ modelSource, preventLoad = false }: Props) =>
  useNonStaticModule({
    module: StyleTransferModule,
    loadArgs: [modelSource],
    preventLoad: preventLoad,
  });
