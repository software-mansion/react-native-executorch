import { useModule } from '../useModule';
import { StyleTransferModule } from '../../modules/computer_vision/StyleTransferModule';
import {
  StyleTransferProps,
  StyleTransferType,
} from '../../types/styleTransfer';

/**
 * React hook for managing a Style Transfer model instance.
 *
 * @category Hooks
 * @param StyleTransferProps - Configuration object containing `model` source and optional `preventLoad` flag.
 * @returns Ready to use Style Transfer model.
 */
export const useStyleTransfer = ({
  model,
  preventLoad = false,
}: StyleTransferProps): StyleTransferType =>
  useModule({
    module: StyleTransferModule,
    model,
    preventLoad: preventLoad,
  });
