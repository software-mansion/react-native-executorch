import { ResourceSource } from '../../types/common';
import { useModule2 } from '../useModule2';
import { StyleTransferModule } from '../../modules/computer_vision/StyleTransferModule';

interface Props {
  modelSource: ResourceSource;
}

export const useStyleTransfer = ({ modelSource }: Props) =>
  useModule2({ module: StyleTransferModule, loadArgs: [modelSource] });
