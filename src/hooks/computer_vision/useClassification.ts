import { ClassificationModule } from '../../modules/computer_vision/ClassificationModule';
import { ResourceSource } from '../../types/common';
import { useModule2 } from '../useModule2';

type LoadArgs = Parameters<typeof ClassificationModule.load>;
type ForwardArgs = Parameters<typeof ClassificationModule.forward>[0];
type ForwardReturn = Awaited<ReturnType<typeof ClassificationModule.forward>>;

export const useClassification = ({
  modelSource,
}: {
  modelSource: ResourceSource;
}) =>
  useModule2<LoadArgs, ForwardArgs, ForwardReturn>({
    loadArgs: [modelSource],
    loadFn: ClassificationModule.load,
    forwardFn: ClassificationModule.forward,
    onDownloadProgress: ClassificationModule.onDownloadProgress,
  });
