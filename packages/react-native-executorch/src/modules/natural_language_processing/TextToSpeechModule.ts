import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import {
  TextToSpeechModelSources,
  TextToSpeechStreamingInput,
  TextToSpeechVoiceConfig,
} from '../../types/tts';
import { Logger } from '../../common/Logger';

/**
 * Module for Text to Speech (TTS) functionalities.
 * @category Typescript API
 */
export class TextToSpeechModule {
  private nativeModule: any;
  private isStreaming: boolean = false;

  private constructor(nativeModule: unknown) {
    this.nativeModule = nativeModule;
  }

  /**
   * Creates a Text to Speech instance.
   * @param config - Configuration object containing `model` and `voice`.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `TextToSpeechModule` instance.
   */
  static async fromModelName(
    config: { model: TextToSpeechModelSources; voice: TextToSpeechVoiceConfig },
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
    model: Extract<TextToSpeechModelSources, { modelName: 'kokoro' }>,
    voice: TextToSpeechVoiceConfig,
    onDownloadProgressCallback: (progress: number) => void
  ): Promise<unknown> {
    const { phonemizerConfig } = voice;

    const sources: ResourceSource[] = [
      model.durationPredictorSource,
      model.synthesizerSource,
      voice.voiceSource,
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

    if (paths === null || paths.length !== sources.length) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'Download interrupted or missing resource.'
      );
    }

    return await global.loadTextToSpeechKokoro(
      phonemizerConfig.lang,
      taggerIdx >= 0 ? (paths[taggerIdx] as string) : '',
      lexiconIdx >= 0 ? (paths[lexiconIdx] as string) : '',
      neuralModelIdx >= 0 ? (paths[neuralModelIdx] as string) : '',
      paths[0] as string, // DurationPredictor source
      paths[1] as string, // Synthesizer source
      paths[2] as string // Voice source
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
    let error: unknown;
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
        error = e;
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
   * Inserts new content (text or IPA phonemes) into the buffer to be processed in streaming mode.
   * @param input - The text or phoneme fragment to append to the streaming buffer.
   */
  public streamInsert(input: string): void {
    this.nativeModule.streamInsert(input);
  }

  /**
   * Stops the streaming process if there is any ongoing.
   * @param instant - If true, stops the streaming as soon as possible. Otherwise
   *                  allows the module to complete processing for the remains of the buffer.
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
