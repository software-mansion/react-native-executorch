import { ClassificationModule } from '../../modules/computer_vision/ClassificationModule';
import { ResourceSource } from '../../types/common';
import { useModule } from '../useModule';

export const useClassification = ({
  modelSource,
}: {
  modelSource: ResourceSource;
}) => useModule({ module: ClassificationModule, loadArgs: [modelSource] });
