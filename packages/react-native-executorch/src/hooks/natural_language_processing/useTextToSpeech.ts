import { useModule } from '../useModule';
import { TextToSpeechModule } from '../../modules/natural_language_processing/TextToSpeechModule';
import { TextToSpeechKokoroConfig } from '../../types/tts';

interface Props {
  model: TextToSpeechKokoroConfig;
  preventLoad?: boolean;
}

export const useTextToSpeech = ({ model, preventLoad = false }: Props) =>
  useModule({
    module: TextToSpeechModule,
    model,
    preventLoad: preventLoad,
  });
