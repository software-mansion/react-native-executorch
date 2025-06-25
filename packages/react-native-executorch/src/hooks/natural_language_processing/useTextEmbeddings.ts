import { TextEmbeddingsModule } from '../../modules/natural_language_processing/TextEmbeddingsModule';
import { ResourceSource } from '../../types/common';
import { useNonStaticModule } from '../useNonStaticModule';

interface Props {
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
  meanPooling?: boolean;
  preventLoad?: boolean;
}

export const useTextEmbeddings = ({
  modelSource,
  tokenizerSource,
  meanPooling,
  preventLoad = false,
}: Props) =>
  useNonStaticModule({
    module: TextEmbeddingsModule,
    loadArgs: [modelSource, tokenizerSource, meanPooling],
    preventLoad,
  });
