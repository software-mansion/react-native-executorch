import { useModule } from '../useModule';
import { ImageSegmentationModule } from '../../modules/computer_vision/ImageSegmentationModule';
import {
  ImageSegmentationProps,
  ImageSegmentationType,
} from '../../types/imageSegmentation';

/**
 * React hook for managing an Image Segmentation model instance.
 *
 * @category Hooks
 * @param ImageSegmentationProps - Configuration object containing `model` source and optional `preventLoad` flag.
 * @returns Ready to use Image Segmentation model.
 */
export const useImageSegmentation = ({
  model,
  preventLoad = false,
}: ImageSegmentationProps): ImageSegmentationType =>
  useModule({
    module: ImageSegmentationModule,
    model,
    preventLoad,
  });
