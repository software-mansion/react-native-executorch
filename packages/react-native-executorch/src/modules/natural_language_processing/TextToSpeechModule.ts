import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ETError, getError } from '../../Error';
import { BaseModule } from '../BaseModule';
import { TextToSpeechKokoroConfig } from '../../types/tts';

export class TextToSpeechModule extends BaseModule {
  async load(
    model: TextToSpeechKokoroConfig, // Can be extended by different types in the future
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ): Promise<void> {
    const anySourceKey = Object.keys(model).find((key) =>
      key.includes('Source')
    );
    if (anySourceKey === undefined) {
      throw new Error('No model source provided.');
    }

    const paths = await ResourceFetcher.fetch(
      onDownloadProgressCallback,
      ...Object.values(model)
    );

    // Select the text to speech model based on the input URL
    const uri = (model as any)[anySourceKey];
    if (uri.includes('kokoro')) {
      if (paths === null || paths.length < 5) {
        throw new Error('Download interrupted.');
      }
      this.nativeModule = global.loadTextToSpeechKokoro(
        paths[0]!,
        paths[1]!,
        paths[2]!,
        paths[3]!,
        paths[4]!
      );
    }
    // ... more models? ...
  }

  async forward(text: string, speed: number) {
    if (this.nativeModule == null)
      throw new Error(getError(ETError.ModuleNotLoaded));
    return await this.nativeModule.generate(text, speed);

    // TODO: add postprocessing with audio-api etc.
  }
}
