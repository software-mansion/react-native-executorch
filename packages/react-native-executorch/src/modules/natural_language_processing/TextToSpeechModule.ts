import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError } from '../../errors/errorUtils';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import {
  KokoroConfig,
  KokoroOptions,
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
    const anySourceKey = Object.keys(config.model).find((key) =>
      key.includes('Source')
    );
    if (anySourceKey === undefined) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidModelSource,
        'No model source provided.'
      );
    }

    // Select the text to speech model based on it's fixed identifier
    if (config.model.type === 'kokoro') {
      await this.loadKokoro(
        config.model,
        config.voice,
        onDownloadProgressCallback,
        config.options as KokoroOptions
      );
    }
    // ... more models? ...
  }

  // Specialized loader - Kokoro model
  private async loadKokoro(
    model: KokoroConfig,
    voice: VoiceConfig,
    onDownloadProgressCallback: (progress: number) => void,
    options?: KokoroOptions
  ): Promise<void> {
    if (
      !voice.extra ||
      !voice.extra.taggerSource ||
      !voice.extra.lexiconSource
    ) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidConfig,
        'Kokoro: voice config is missing required extra fields: taggerSource and/or lexiconSource.'
      );
    }

    const paths = await ResourceFetcher.fetch(
      onDownloadProgressCallback,
      model.durationPredictorSource,
      model.f0nPredictorSource,
      model.textEncoderSource,
      model.textDecoderSource,
      voice.voiceSource,
      voice.extra.taggerSource,
      voice.extra.lexiconSource
    );

    if (paths === null || paths.length !== 7 || paths.some((p) => p == null)) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'Download interrupted or missing resource.'
      );
    }

    const modelPaths = paths.slice(0, 4) as [string, string, string, string];
    const voiceDataPath = paths[4] as string;
    const phonemizerPaths = paths.slice(5, 7) as [string, string];

    this.nativeModule = global.loadTextToSpeechKokoro(
      voice.lang,
      phonemizerPaths[0],
      phonemizerPaths[1],
      modelPaths[0],
      modelPaths[1],
      modelPaths[2],
      modelPaths[3],
      voiceDataPath
    );

    // Handle extra options
    if (options && options.fixedModel) {
      this.nativeModule.setFixedModel(options.fixedModel);
    }
  }

  public async forward(text: string, speed: number = 1.0) {
    if (this.nativeModule == null)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
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
