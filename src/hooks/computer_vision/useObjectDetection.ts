import { ResourceSource } from '../../types/common';
import { useModule } from '../useModule';
import { ObjectDetectionModule } from '../../modules/computer_vision/ObjectDetectionModule';

interface Props {
  modelSource: ResourceSource;
}

export const useObjectDetection = ({ modelSource }: Props) =>
  useModule({ module: ObjectDetectionModule, loadArgs: [modelSource] });
