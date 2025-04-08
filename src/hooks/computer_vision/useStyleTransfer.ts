import { ResourceSource } from '../../types/common';
import { useModule } from '../useModule';
import { StyleTransferModule } from '../../modules/computer_vision/StyleTransferModule';

interface Props {
  modelSource: ResourceSource;
}

export const useStyleTransfer = ({ modelSource }: Props) =>
  useModule({ module: StyleTransferModule, loadArgs: [modelSource] });
