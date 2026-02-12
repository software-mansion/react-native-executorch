import {
  DecodingOptions,
  SpeechToTextModelConfig,
  TranscriptionResult,
} from '../../types/stt';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

/**
 * Module for Speech to Text (STT) functionalities.
 *
 * @category Typescript API
 */
export class SpeechToTextModule {
  private nativeModule: any;
  private modelConfig!: SpeechToTextModelConfig;

  /**
   * Loads the model specified by the config object.
   * `onDownloadProgressCallback` allows you to monitor the current progress of the model download.
   *
   * @param model - Configuration object containing model sources.
   * @param onDownloadProgressCallback - Optional callback to monitor download progress.
   */
  public async load(
    model: SpeechToTextModelConfig,
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ) {
    this.modelConfig = model;

    const tokenizerLoadPromise = ResourceFetcher.fetch(
      undefined,
      model.tokenizerSource
    );
    const encoderDecoderPromise = ResourceFetcher.fetch(
      onDownloadProgressCallback,
      model.encoderSource,
      model.decoderSource
    );
    const [tokenizerSources, encoderDecoderResults] = await Promise.all([
      tokenizerLoadPromise,
      encoderDecoderPromise,
    ]);
    const encoderSource = encoderDecoderResults?.[0];
    const decoderSource = encoderDecoderResults?.[1];
    if (!encoderSource || !decoderSource || !tokenizerSources) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
      );
    }
    this.nativeModule = await global.loadSpeechToText(
      encoderSource,
      decoderSource,
      tokenizerSources[0]!
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
    return new Float32Array(await this.nativeModule.encode(waveform));
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
    return new Float32Array(
      await this.nativeModule.decode(tokens, encoderOutput)
    );
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
