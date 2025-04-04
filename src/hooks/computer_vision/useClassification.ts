import { ClassificationModule } from '../../modules/computer_vision/ClassificationModule';
import { ResourceSource } from '../../types/common';
import { useModule2 } from '../useModule2';

export const useClassification = ({
  modelSource,
}: {
  modelSource: ResourceSource;
}) => useModule2({ module: ClassificationModule, loadArgs: [modelSource] });
