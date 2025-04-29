import { ResourceSource } from '../../types/common';
import { useNonStaticModule } from '../useNonStaticModule';
import { StyleTransferModule } from '../../modules/computer_vision/StyleTransferModule';

interface Props {
  modelSource: ResourceSource;
}

export const useStyleTransfer = ({ modelSource }: Props) =>
  useNonStaticModule<
    typeof StyleTransferModule,
    Parameters<(typeof StyleTransferModule)['load']>,
    [string],
    string
  >({ module: StyleTransferModule, loadArgs: [modelSource] });
