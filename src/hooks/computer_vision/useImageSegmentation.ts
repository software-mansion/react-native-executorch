import { useModule } from '../useModule';
import { ImageSegmentationModule } from '../../modules/computer_vision/ImageSegmentationModule';

interface Props {
  modelSource: string | number;
}

export const useImageSegmentation = ({ modelSource }: Props) =>
  useModule({ module: ImageSegmentationModule, loadArgs: [modelSource] });
