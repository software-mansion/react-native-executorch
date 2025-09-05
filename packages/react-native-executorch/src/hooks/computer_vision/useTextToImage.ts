import { useModule } from '../useModule';
import { TextToImageModule } from '../../modules/computer_vision/TextToImageModule';
import { ResourceSource } from '../../types/common';

interface Props {
  model: {
    tokenizerSource: ResourceSource;
    schedulerSource: ResourceSource;
    encoderSource: ResourceSource;
    unetSource: ResourceSource;
    decoderSource: ResourceSource;
    imageSize: number;
  };
  preventLoad?: boolean;
}

export const useTextToImage = ({ model, preventLoad = false }: Props) =>
  useModule({
    module: TextToImageModule,
    model,
    preventLoad,
  });
