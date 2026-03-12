import {
  DecodingOptions,
  SpeechToTextModelConfig,
  SpeechToTextModelName,
  TranscriptionResult,
} from '../../types/stt';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';
import { Logger } from '../../common/Logger';

/**
 * Module for Speech to Text (STT) functionalities.
 *
 * @category Typescript API
 */
export class SpeechToTextModule {
  private nativeModule: any;
  private modelConfig: SpeechToTextModelConfig;

  private constructor(
    nativeModule: unknown,
    modelConfig: SpeechToTextModelConfig
  ) {
    this.nativeModule = nativeModule;
    this.modelConfig = modelConfig;
  }

  /**
   * Creates a Speech to Text instance for a built-in model.
   *
   * @param namedSources - Configuration object containing model name, sources, and multilingual flag.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `SpeechToTextModule` instance.
   *
   * @example
   * ```ts
   * import { SpeechToTextModule, WHISPER_TINY_EN } from 'react-native-executorch';
   * const stt = await SpeechToTextModule.fromModelName(WHISPER_TINY_EN);
   * ```
   */
  static async fromModelName(
    namedSources: SpeechToTextModelConfig,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<SpeechToTextModule> {
    try {
      const nativeModule = await SpeechToTextModule.loadWhisper(
        namedSources,
        onDownloadProgress
      );
      return new SpeechToTextModule(nativeModule, namedSources);
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Creates a Speech to Text instance with user-provided model binaries.
   * Use this when working with a custom-exported STT model.
   * Internally uses `'custom'` as the model name for telemetry.
   *
   * @remarks The native model contract for this method is not formally defined and may change
   * between releases. Currently only the Whisper architecture is supported by the native runner.
   * Refer to the native source code for the current expected interface.
   *
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param tokenizerSource - A fetchable resource pointing to the tokenizer file.
   * @param isMultilingual - Whether the model supports multiple languages.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `SpeechToTextModule` instance.
   */
  static fromCustomModel(
    modelSource: ResourceSource,
    tokenizerSource: ResourceSource,
    isMultilingual: boolean,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<SpeechToTextModule> {
    return SpeechToTextModule.fromModelName(
      {
        modelName: 'custom' as SpeechToTextModelName,
        modelSource,
        tokenizerSource,
        isMultilingual,
      },
      onDownloadProgress
    );
  }

  private static async loadWhisper(
    model: SpeechToTextModelConfig,
    onDownloadProgressCallback: (progress: number) => void
  ): Promise<unknown> {
    const tokenizerLoadPromise = ResourceFetcher.fetch(
      undefined,
      model.tokenizerSource
    );
    const modelPromise = ResourceFetcher.fetch(
      onDownloadProgressCallback,
      model.modelSource
    );
    const [tokenizerSources, modelSources] = await Promise.all([
      tokenizerLoadPromise,
      modelPromise,
    ]);
    if (!modelSources?.[0] || !tokenizerSources?.[0]) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
      );
    }
    // Currently only Whisper architecture is supported
    return await global.loadSpeechToText(
      'whisper',
      modelSources[0],
      tokenizerSources[0]
    );
  }

  /**
   * Unloads the model from memory.
   */
  public delete(): void {
    this.nativeModule?.unload();
  }

  /**
   * Runs the encoding part of the model on the provided waveform.
   * Returns the encoded waveform as a Float32Array.
   *
   * @param waveform - The input audio waveform.
   * @returns The encoded output.
   */
  public async encode(waveform: Float32Array): Promise<Float32Array> {
    const buffer = await this.nativeModule.encode(waveform);
    return new Float32Array(buffer);
  }

  /**
   * Runs the decoder of the model.
   *
   * @param tokens - The input tokens.
   * @param encoderOutput - The encoder output.
   * @returns Decoded output.
   */
  public async decode(
    tokens: Int32Array,
    encoderOutput: Float32Array
  ): Promise<Float32Array> {
    const buffer = await this.nativeModule.decode(tokens, encoderOutput);
    return new Float32Array(buffer);
  }

  /**
   * Starts a transcription process for a given input array (16kHz waveform).
   * For multilingual models, specify the language in `options`.
   * Returns the transcription as a string. Passing `number[]` is deprecated.
   *
   * @param waveform - The Float32Array audio data.
   * @param options - Decoding options including language.
   * @returns The transcription string.
   */
  public async transcribe(
    waveform: Float32Array,
    options: DecodingOptions = {}
  ): Promise<TranscriptionResult> {
    this.validateOptions(options);
    return await this.nativeModule.transcribe(
      waveform,
      options.language || '',
      !!options.verbose
    );
  }

  /**
   * Starts a streaming transcription session.
   * Yields objects with `committed` and `nonCommitted` transcriptions.
   * Committed transcription contains the part of the transcription that is finalized and will not change.
   * Useful for displaying stable results during streaming.
   * Non-committed transcription contains the part of the transcription that is still being processed and may change.
   * Useful for displaying live, partial results during streaming.
   * Use with `streamInsert` and `streamStop` to control the stream.
   *
   * @param options - Decoding options including language.
   * @returns An async generator yielding transcription updates.
   */
  public async *stream(options: DecodingOptions = {}): AsyncGenerator<{
    committed: TranscriptionResult;
    nonCommitted: TranscriptionResult;
  }> {
    this.validateOptions(options);

    const verbose = !!options.verbose;
    const language = options.language || '';

    const queue: {
      committed: TranscriptionResult;
      nonCommitted: TranscriptionResult;
    }[] = [];

    let waiter: (() => void) | null = null;
    let finished = false;
    let error: unknown;

    const wake = () => {
      waiter?.();
      waiter = null;
    };

    (async () => {
      try {
        await this.nativeModule.stream(
          (
            committed: TranscriptionResult,
            nonCommitted: TranscriptionResult,
            isDone: boolean
          ) => {
            queue.push({
              committed,
              nonCommitted,
            });

            if (isDone) {
              finished = true;
            }
            wake();
          },
          language,
          verbose
        );

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
      if (error) throw parseUnknownError(error);
      if (finished) return;
      await new Promise<void>((r) => (waiter = r));
    }
  }

  /**
   * Inserts a new audio chunk into the streaming transcription session.
   *
   * @param waveform - The audio chunk to insert.
   */
  public streamInsert(waveform: Float32Array): void {
    this.nativeModule.streamInsert(waveform);
  }

  /**
   * Stops the current streaming transcription session.
   */
  public streamStop(): void {
    this.nativeModule.streamStop();
  }

  private validateOptions(options: DecodingOptions) {
    if (!this.modelConfig.isMultilingual && options.language) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidConfig,
        'Model is not multilingual, cannot set language'
      );
    }
    if (this.modelConfig.isMultilingual && !options.language) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidConfig,
        'Model is multilingual, provide a language'
      );
    }
  }
}
