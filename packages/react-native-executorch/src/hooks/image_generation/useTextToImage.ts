import { useModule } from '../useModule';
import { TextToImageModule } from '../../modules/image_generation/TextToImageModule';
import { ResourceSource } from '../../types/common';

interface Props {
  model: { tokenizerSource: ResourceSource; encoderSource: ResourceSource };
  preventLoad?: boolean;
}

export const useTextToImage = ({ model, preventLoad = false }: Props) =>
  useModule({
    module: TextToImageModule,
    model,
    preventLoad,
  });
