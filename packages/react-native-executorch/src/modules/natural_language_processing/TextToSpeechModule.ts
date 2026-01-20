import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ETError, getError } from '../../Error';
import {
  KokoroConfig,
  TextToSpeechConfig,
  TextToSpeechStreamingInput,
  VoiceConfig,
} from '../../types/tts';

export class TextToSpeechModule {
  nativeModule: any = null;

  public async load(
    config: TextToSpeechConfig,
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ): Promise<void> {
    // Select the text to speech model based on it's fixed identifier
    if (config.model.type === 'kokoro') {
      await this.loadKokoro(
        config.model,
        config.voice,
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
    if (
      !voice.extra ||
      !voice.extra.taggerSource ||
      !voice.extra.lexiconSource
    ) {
      throw new Error(
        'Kokoro: voice config is missing required extra fields: taggerSource and/or lexiconSource.'
      );
    }

    const paths = await ResourceFetcher.fetch(
      onDownloadProgressCallback,
      model.durationPredictorSource,
      model.synthesizerSource,
      voice.voiceSource,
      voice.extra.taggerSource,
      voice.extra.lexiconSource
    );

    if (paths === null || paths.length !== 5 || paths.some((p) => p == null)) {
      throw new Error('Download interrupted or missing resource.');
    }

    const modelPaths = paths.slice(0, 2) as [string, string, string, string];
    const voiceDataPath = paths[2] as string;
    const phonemizerPaths = paths.slice(3, 5) as [string, string];

    this.nativeModule = global.loadTextToSpeechKokoro(
      voice.lang,
      phonemizerPaths[0],
      phonemizerPaths[1],
      modelPaths[0],
      modelPaths[1],
      voiceDataPath
    );
  }

  public async forward(text: string, speed: number = 1.0) {
    if (this.nativeModule == null)
      throw new Error(getError(ETError.ModuleNotLoaded));
    return await this.nativeModule.generate(text, speed);
  }

  public async *stream({ text, speed }: TextToSpeechStreamingInput) {
    // Stores computed audio segments
    const queue: Float32Array[] = [];

    let waiter: (() => void) | null = null;
    let finished = false;
    let error: unknown;

    const wake = () => {
      waiter?.();
      waiter = null;
    };

    (async () => {
      try {
        await this.nativeModule.stream(text, speed, (audio: number[]) => {
          queue.push(new Float32Array(audio));
          wake();
        });
        finished = true;
        wake();
      } catch (e) {
        error = e;
        finished = true;
        wake();
      }
    })();

    while (true) {
      if (queue.length > 0) {
        yield queue.shift()!;
        if (finished && queue.length === 0) {
          return;
        }
        continue;
      }
      if (error) throw error;
      if (finished) return;
      await new Promise<void>((r) => (waiter = r));
    }
  }

  delete() {
    if (this.nativeModule !== null) {
      this.nativeModule.unload();
    }
  }
}
