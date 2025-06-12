import { TextEmbeddingsModule } from '../../modules/natural_language_processing/TextEmbeddingsModule';
import { ResourceSource } from '../../types/common';
import { useModule } from '../useModule';

export const useTextEmbeddings = ({
  modelSource,
  tokenizerSource,
  meanPooling,
  preventLoad = false,
}: {
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
  meanPooling?: boolean;
  preventLoad?: boolean;
}) =>
  useModule({
    module: TextEmbeddingsModule,
    loadArgs: [modelSource, tokenizerSource, meanPooling],
    preventLoad,
  });
