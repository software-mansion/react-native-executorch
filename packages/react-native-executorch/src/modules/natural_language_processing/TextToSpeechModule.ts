import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import {
  KokoroConfig,
  TextToSpeechConfig,
  TextToSpeechStreamingInput,
  TextToSpeechStreamingPhonemeInput,
  VoiceConfig,
} from '../../types/tts';
import { Logger } from '../../common/Logger';

/**
 * Module for Text to Speech (TTS) functionalities.
 *
 * @category Typescript API
 */
export class TextToSpeechModule {
  private nativeModule: any;

  private constructor(nativeModule: unknown) {
    this.nativeModule = nativeModule;
  }

  /**
   * Creates a Text to Speech instance.
   *
   * @param config - Configuration object containing `model` and `voice`.
   *   Pass one of the built-in constants (e.g. `{ model: KOKORO_MEDIUM, voice: KOKORO_VOICE_AF_HEART }`), or use require() to pass them.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `TextToSpeechModule` instance.
   *
   * @example
   * ```ts
   * import { TextToSpeechModule, KOKORO_MEDIUM, KOKORO_VOICE_AF_HEART } from 'react-native-executorch';
   * const tts = await TextToSpeechModule.fromModelName(
   *   { model: KOKORO_MEDIUM, voice: KOKORO_VOICE_AF_HEART },
   * );
   * ```
   */
  static async fromModelName(
    config: TextToSpeechConfig,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<TextToSpeechModule> {
    try {
      const nativeModule = await TextToSpeechModule.loadKokoro(
        config.model,
        config.voice,
        onDownloadProgress
      );
      return new TextToSpeechModule(nativeModule);
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  private static async loadKokoro(
    model: KokoroConfig,
    voice: VoiceConfig,
    onDownloadProgressCallback: (progress: number) => void
  ): Promise<unknown> {
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

    if (paths === null || paths.length !== 5) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'Download interrupted or missing resource.'
      );
    }

    const modelPaths = paths.slice(0, 2) as [string, string];
    const voiceDataPath = paths[2] as string;
    const phonemizerPaths = paths.slice(3, 5) as [string, string];

    return await global.loadTextToSpeechKokoro(
      voice.lang,
      phonemizerPaths[0],
      phonemizerPaths[1],
      modelPaths[0],
      modelPaths[1],
      voiceDataPath
    );
  }

  private ensureLoaded(methodName: string): void {
    if (this.nativeModule == null)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        `The model is currently not loaded. Please load the model before calling ${methodName}().`
      );
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
    this.ensureLoaded('forward');
    return await this.nativeModule.generate(text, speed);
  }

  /**
   * Synthesizes pre-computed phonemes into speech, bypassing the built-in phonemizer.
   * This allows using an external G2P system (e.g. the Python `phonemizer` library,
   * espeak-ng, or any custom phonemizer).
   *
   * @param phonemes The pre-computed IPA phoneme string.
   * @param speed Optional speed multiplier for the speech synthesis (default is 1.0).
   * @returns A promise resolving to the synthesized audio waveform.
   */
  public async forwardFromPhonemes(
    phonemes: string,
    speed: number = 1.0
  ): Promise<Float32Array> {
    this.ensureLoaded('forwardFromPhonemes');
    return await this.nativeModule.generateFromPhonemes(phonemes, speed);
  }

  /**
   * Shared streaming implementation. Wraps a native streaming call in an
   * async generator that yields Float32Array audio chunks as they arrive.
   */
  private async *streamImpl(
    nativeCall: (cb: (audio: number[]) => void) => Promise<void>
  ): AsyncGenerator<Float32Array> {
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
        await nativeCall((audio: number[]) => {
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
   * Starts a streaming synthesis session. Yields audio chunks as they are generated.
   *
   * @param input - Input object containing text and optional speed.
   * @returns An async generator yielding Float32Array audio chunks.
   */
  public async *stream({
    text,
    speed,
  }: TextToSpeechStreamingInput): AsyncGenerator<Float32Array> {
    yield* this.streamImpl((cb) => this.nativeModule.stream(text, speed, cb));
  }

  /**
   * Starts a streaming synthesis session from pre-computed phonemes.
   * Bypasses the built-in phonemizer, allowing use of external G2P systems.
   *
   * @param input - Input object containing phonemes and optional speed.
   * @returns An async generator yielding Float32Array audio chunks.
   */
  public async *streamFromPhonemes({
    phonemes,
    speed,
  }: TextToSpeechStreamingPhonemeInput): AsyncGenerator<Float32Array> {
    yield* this.streamImpl((cb) =>
      this.nativeModule.streamFromPhonemes(phonemes, speed, cb)
    );
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
