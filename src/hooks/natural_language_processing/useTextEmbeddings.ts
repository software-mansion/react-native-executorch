import { TextEmbeddingsModule } from '../../modules/natural_language_processing/TextEmbeddingsModule';
import { ResourceSource } from '../../types/common';
import { useModule2 } from '../useModule2';

export const useTextEmbeddings = ({
  modelSource,
  tokenizerSource,
}: {
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
}) =>
  useModule2({
    module: TextEmbeddingsModule,
    loadArgs: [modelSource, tokenizerSource],
  });
