import { ResourceSource } from '../../types/common';
import { useModule2 } from '../useModule2';
import { ObjectDetection } from '../../native/RnExecutorchModules';

interface Props {
  modelSource: ResourceSource;
}

export const useObjectDetection = ({ modelSource }: Props) =>
  useModule2({ module: ObjectDetection, loadArgs: [modelSource] });
