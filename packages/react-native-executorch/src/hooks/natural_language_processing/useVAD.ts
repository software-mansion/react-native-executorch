import { ResourceSource } from '../../types/common';
import { useModule } from '../useModule';
import { VADModule } from '../../modules/natural_language_processing/VADModule';

interface Props {
  model: { modelSource: ResourceSource };
  preventLoad?: boolean;
}

export const useVAD = ({ model, preventLoad = false }: Props) =>
  useModule({
    module: VADModule,
    model,
    preventLoad: preventLoad,
  });
