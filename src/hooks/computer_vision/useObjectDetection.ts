import { ResourceSource } from '../../types/common';
import { useModule2 } from '../useModule2';
import { ObjectDetectionModule } from '../../modules/computer_vision/ObjectDetectionModule';

interface Props {
  modelSource: ResourceSource;
}

export const useObjectDetection = ({ modelSource }: Props) =>
  useModule2({ module: ObjectDetectionModule, loadArgs: [modelSource] });
