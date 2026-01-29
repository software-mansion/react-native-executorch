import { useModule } from '../useModule';
import { ObjectDetectionModule } from '../../modules/computer_vision/ObjectDetectionModule';
import { ObjectDetectionProps, ObjectDetectionType } from '../../types/objectDetection';

/**
 * React hook for managing an Object Detection model instance.
 * 
 * @category Hooks
 * @param ObjectDetectionProps - Configuration object containing `model` source and optional `preventLoad` flag.
 * @returns Ready to use Object Detection model.
 */
export const useObjectDetection = ({ model, preventLoad = false }: ObjectDetectionProps): ObjectDetectionType =>
  useModule({
    module: ObjectDetectionModule,
    model,
    preventLoad: preventLoad,
  });
