import { useModule } from '../useModule';
import { ClassificationModule } from '../../modules/computer_vision/ClassificationModule';
import { ClassificationProps, ClassificationType } from '../../types/classification';

/**
 * React hook for managing a Classification model instance.
 * 
 * @category Hooks
 * @param ClassificationConfiguration - Configuration object containing `model` source and optional `preventLoad` flag. 
 * @returns Ready to use Classification model.
 */
export const useClassification = ({ model, preventLoad = false }: ClassificationProps): ClassificationType =>
  useModule({
    module: ClassificationModule,
    model,
    preventLoad: preventLoad,
  });
