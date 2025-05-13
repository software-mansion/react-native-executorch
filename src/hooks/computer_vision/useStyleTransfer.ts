import { ResourceSource } from '../../types/common';
import { useNonStaticModule } from '../useNonStaticModule';
import { StyleTransferModule } from '../../modules/computer_vision/StyleTransferModule';

interface Props {
  modelSource: ResourceSource;
  doNotLoad?: boolean;
}

export const useStyleTransfer = ({ modelSource, doNotLoad = false }: Props) =>
  useNonStaticModule({
    module: StyleTransferModule,
    loadArgs: [modelSource],
    doNotLoad: doNotLoad,
  });
