import { TextEmbeddingsModule } from '../../modules/natural_language_processing/TextEmbeddingsModule';
import { ResourceSource } from '../../types/common';
import { useModule2 } from '../useModule2';

type LoadArgs = Parameters<typeof TextEmbeddingsModule.load>;
type ForwardArgs = Parameters<typeof TextEmbeddingsModule.forward>;
type ForwardReturn = Awaited<ReturnType<typeof TextEmbeddingsModule.forward>>;

export const useTextEmbeddings = ({
  modelSource,
  tokenizerSource,
}: {
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
}) =>
  useModule2<LoadArgs, ForwardArgs, ForwardReturn>({
    loadArgs: [modelSource, tokenizerSource],
    loadFn: TextEmbeddingsModule.load,
    forwardFn: TextEmbeddingsModule.forward,
    onDownloadProgress: TextEmbeddingsModule.onDownloadProgress,
  });
