import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import {
  KokoroConfig,
  TextToSpeechConfig,
  TextToSpeechStreamingInput,
  VoiceConfig,
} from '../../types/tts';
import { Logger } from '../../common/Logger';

/**
 * Module for Text to Speech (TTS) functionalities.
 *
 * @category Typescript API
 */
export class TextToSpeechModule {
  /**
   * Native module instance
   */
  nativeModule: any = null;

  /**
   * Loads the model and voice assets specified by the config object.
   * `onDownloadProgressCallback` allows you to monitor the current progress.
   *
   * @param config - Configuration object containing `model` source and `voice`.
   * @param onDownloadProgressCallback - Optional callback to monitor download progress.
   */
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
    try {
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
        model.synthesizerSource,
        voice.voiceSource,
        voice.extra.taggerSource,
        voice.extra.lexiconSource
      );

      if (
        paths === null ||
        paths.length !== 5 ||
        paths.some((p) => p == null)
      ) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.DownloadInterrupted,
          'Download interrupted or missing resource.'
        );
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
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Synthesizes the provided text into speech.
   * Returns a promise that resolves to the full audio waveform as a `Float32Array`.
   *
   * @param text The input text to be synthesized.
   * @param speed Optional speed multiplier for the speech synthesis (default is 1.0).
   * @returns A promise resolving to the synthesized audio waveform.
   */
  public async forward(
    text: string,
    speed: number = 1.0
  ): Promise<Float32Array> {
    if (this.nativeModule == null)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    return await this.nativeModule.generate(text, speed);
  }

  /**
   * Starts a streaming synthesis session. Yields audio chunks as they are generated.
   *
   * @param input - Input object containing text and optional speed.
   * @returns An async generator yielding Float32Array audio chunks.
   */
  public async *stream({
    text,
    speed,
  }: TextToSpeechStreamingInput): AsyncGenerator<Float32Array> {
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

  /**
   * Stops the streaming process if there is any ongoing.
   */
  public streamStop(): void {
    this.nativeModule.streamStop();
  }

  /**
   * Unloads the model from memory.
   */
  delete() {
    if (this.nativeModule !== null) {
      this.nativeModule.unload();
    }
  }
}
