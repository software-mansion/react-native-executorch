import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import {
  TextToSpeechModelConfig,
  TextToSpeechModelSources,
  TextToSpeechStreamingInput,
} from '../../types/tts';
import { Logger } from '../../common/Logger';
import { BaseModule } from '../BaseModule';

/**
 * Module for Text to Speech (TTS) functionalities.
 * @category Typescript API
 */
export class TextToSpeechModule extends BaseModule {
  private isStreaming: boolean = false;

  private constructor(nativeModule: unknown) {
    super();
    this.nativeModule = nativeModule;
  }

  /**
   * Creates a Text to Speech instance.
   * @param config - Configuration object containing model and voice sources.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `TextToSpeechModule` instance.
   */
  static async fromModelName(
    config: TextToSpeechModelConfig,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<TextToSpeechModule> {
    try {
      const nativeModule = await TextToSpeechModule.loadKokoro(
        config,
        onDownloadProgress
      );
      return new TextToSpeechModule(nativeModule);
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  private static async loadKokoro(
    config: TextToSpeechModelConfig,
    onDownloadProgressCallback: (progress: number) => void
  ): Promise<unknown> {
    const { model, voiceSource, phonemizerConfig } = config;
    const kokoroModel = model as Extract<
      TextToSpeechModelSources,
      { modelName: 'kokoro' }
    >;

    const sources: ResourceSource[] = [
      kokoroModel.durationPredictorSource,
      kokoroModel.synthesizerSource,
      voiceSource,
    ];

    // Since each of these args is optional, we need to handle the sources array in a dynamic way.
    const taggerIdx = phonemizerConfig.taggerSource
      ? sources.push(phonemizerConfig.taggerSource) - 1
      : -1;
    const lexiconIdx = phonemizerConfig.lexiconSource
      ? sources.push(phonemizerConfig.lexiconSource) - 1
      : -1;
    const neuralModelIdx = phonemizerConfig.neuralModelSource
      ? sources.push(phonemizerConfig.neuralModelSource) - 1
      : -1;

    const paths = await ResourceFetcher.fetch(
      onDownloadProgressCallback,
      ...sources
    );

    // Required fields
    const [duration, synth, voice] = paths;
    if (!duration || !synth || !voice) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'Kokoro: missing required model paths.'
      );
    }

    // Optional fields
    const tagger = paths[taggerIdx] ?? '';
    const lexicon = paths[lexiconIdx] ?? '';
    const neural = paths[neuralModelIdx] ?? '';

    return await global.loadTextToSpeechKokoro(
      phonemizerConfig.lang,
      tagger,
      lexicon,
      neural,
      duration,
      synth,
      voice
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
   * Synthesizes the provided input (text or IPA phonemes) into speech.
   * @param input - The input text or phonemes to be synthesized.
   * @param speed - Playback speed multiplier (default: 1.0).
   * @param phonemize - If true (default), treats input as text and converts it to phonemes.
   *                    If false, input is treated as phonemes.
   * @returns A promise resolving to the full audio waveform as a `Float32Array`.
   */
  public async forward(
    input: string,
    speed: number = 1.0,
    phonemize: boolean = true
  ): Promise<Float32Array> {
    this.ensureLoaded('forward');
    return await this.nativeModule.generate(input, speed, phonemize);
  }

  /**
   * Starts a streaming synthesis session. Yields audio chunks as they are generated.
   * @param input - Input object containing optional speed, phonemize flag and stopAutomatically flag.
   * @yields An audio chunk generated during synthesis.
   * @returns An async generator yielding Float32Array audio chunks.
   */
  public async *stream({
    speed = 1.0,
    phonemize = true,
    stopAutomatically = true,
  }: TextToSpeechStreamingInput): AsyncGenerator<Float32Array> {
    const queue: Float32Array[] = [];

    let waiter: (() => void) | null = null;
    let error: RnExecutorchError | undefined;
    let nativeStreamFinished = false;

    this.isStreaming = true;

    const wake = () => {
      waiter?.();
      waiter = null;
    };

    (async () => {
      try {
        await this.nativeModule.stream(
          (audio: number[]) => {
            queue.push(new Float32Array(audio));
            wake();
          },
          speed,
          phonemize,
          stopAutomatically
        );
        nativeStreamFinished = true;
        wake();
      } catch (e) {
        error = parseUnknownError(e);
        nativeStreamFinished = true;
        wake();
      }
    })();

    while (this.isStreaming) {
      if (queue.length > 0) {
        yield queue.shift()!;
        if (nativeStreamFinished && queue.length === 0) {
          return;
        }
        continue;
      }
      if (error) throw error;
      if (nativeStreamFinished && queue.length === 0) return;
      await new Promise<void>((r) => (waiter = r));
    }
  }

  /**
   * Inserts new content (text or IPA phonemes) into the buffer to be processed
   * in streaming mode. Trailing un-terminated content sits in the buffer
   * until {@link TextToSpeechModule.streamFlush} or `streamStop(false)`
   * releases it.
   * @param input - The text or phoneme fragment to append to the streaming buffer.
   */
  public streamInsert(input: string): void {
    this.nativeModule.streamInsert(input);
  }

  /**
   * Force-partitions whatever is currently buffered, even without an
   * end-of-sentence character. Call after the final `streamInsert` of an
   * utterance to play out the trailing tail without ending the stream.
   */
  public streamFlush(): void {
    this.nativeModule.streamFlush();
  }

  /**
   * Stops the streaming process if there is any ongoing.
   * @param instant - If true, stops the streaming as soon as possible. Otherwise
   *                  drains the current buffer (force-flushing any trailing
   *                  un-terminated content) before stopping.
   */
  public streamStop(instant: boolean = true): void {
    this.nativeModule.streamStop(instant);

    if (instant) {
      this.isStreaming = false;
    }
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
