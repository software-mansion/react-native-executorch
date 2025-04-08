import { useModule2 } from '../useModule2';
import { ImageSegmentationModule } from '../../modules/computer_vision/ImageSegmentationModule';

interface Props {
  modelSource: string | number;
}

export const useImageSegmentation = ({ modelSource }: Props) =>
  useModule2({ module: ImageSegmentationModule, loadArgs: [modelSource] });
