import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ETError, getError } from '../../Error';
import { BaseModule } from '../BaseModule';
import {
  KokoroConfig,
  TextToSpeechConfig,
  TextToSpeechStreamingInput,
  VoiceConfig,
} from '../../types/tts';

export class TextToSpeechModule extends BaseModule {
  async load(
    config: TextToSpeechConfig,
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ): Promise<void> {
    // TODO: this check is pretty dubious and should be replaced with something better.
    const anySourceKey = Object.keys(config.model).find((key) =>
      key.includes('Source')
    );
    if (anySourceKey === undefined) {
      throw new Error('No model source provided.');
    }

    // Select the text to speech model based on the input URL
    const uri = (config.model as any)[anySourceKey];
    if (uri.includes('kokoro')) {
      await this.loadKokoro(
        config.model,
        config.voice!,
        onDownloadProgressCallback
      );
    }
    // ... more models? ...
  }

  // Specialized loader - Kokoro model
  private async loadKokoro(
    model: KokoroConfig,
    voice: VoiceConfig,
    onDownloadProgressCallback: (progress: number) => void
  ): Promise<void> {
    if (!voice.extra || !voice.extra.tagger || !voice.extra.lexicon) {
      throw new Error(
        'Kokoro: voice config is missing required extra fields: tagger and/or lexicon.'
      );
    }

    const paths = await ResourceFetcher.fetch(
      onDownloadProgressCallback,
      ...Object.values(model),
      voice.data,
      voice.extra!.tagger,
      voice.extra!.lexicon
    );

    if (paths === null || paths.length < 7) {
      throw new Error('Download interrupted.');
    }

    const modelPaths = paths.slice(0, 4);
    const voiceDataPath = paths[4];
    const phonemizerPaths = paths.slice(5, 7);

    this.nativeModule = global.loadTextToSpeechKokoro(
      voice.language,
      phonemizerPaths[0]!,
      phonemizerPaths[1]!,
      modelPaths[0]!,
      modelPaths[1]!,
      modelPaths[2]!,
      modelPaths[3]!,
      voiceDataPath!
    );
  }

  public async forward(text: string, speed: number = 1.0) {
    if (this.nativeModule == null)
      throw new Error(getError(ETError.ModuleNotLoaded));
    return await this.nativeModule.generate(text, speed);
  }

  public async stream({
    text,
    onBegin,
    onNext,
    onEnd,
    speed,
  }: TextToSpeechStreamingInput) {
    let queue = Promise.resolve();

    onBegin?.();

    try {
      await this.nativeModule.stream(text, speed, (audio: number[]) => {
        queue = queue.then(() =>
          Promise.resolve(onNext?.(new Float32Array(audio)))
        );
      });

      await queue;
    } catch (e) {
      throw e;
    } finally {
      onEnd?.();
    }
  }
}
