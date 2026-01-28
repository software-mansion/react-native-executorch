import { useModule } from '../useModule';
import { VADModule } from '../../modules/natural_language_processing/VADModule';
import { VADType, VADProps } from '../../types/vad';

/**
 * React hook for managing a VAD model instance.
 * 
 * @category Hooks
 * @param VADConfiguration - Configuration object containing `model` source and optional `preventLoad` flag. 
 * @returns Ready to use VAD model.
 */
export const useVAD = ({ model, preventLoad = false }: VADProps): VADType =>
  useModule({
    module: VADModule,
    model,
    preventLoad: preventLoad,
  });
