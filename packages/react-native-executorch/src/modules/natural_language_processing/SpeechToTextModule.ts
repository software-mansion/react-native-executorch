import { Logger } from '../../common/Logger';
import { DecodingOptions, SpeechToTextModelConfig } from '../../types/stt';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

/**
 * Module for Speech to Text (STT) functionalities.
 */
export class SpeechToTextModule {
  private nativeModule: any;

  private modelConfig!: SpeechToTextModelConfig;

  private textDecoder = new TextDecoder('utf-8', {
    fatal: false,
    ignoreBOM: true,
  });

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
    this.nativeModule.unload();
  }

  /**
   * Runs the encoding part of the model on the provided waveform.
   * Returns the encoded waveform as a Float32Array. Passing `number[]` is deprecated.
   * 
   * @param waveform - The input audio waveform.
   * @returns The encoded output.
   */
  public async encode(
    waveform: Float32Array | number[]
  ): Promise<Float32Array> {
    if (Array.isArray(waveform)) {
      Logger.info(
        'Passing waveform as number[] is deprecated, use Float32Array instead'
      );
      waveform = new Float32Array(waveform);
    }
    return new Float32Array(await this.nativeModule.encode(waveform));
  }

  /**
   * Runs the decoder of the model. Passing number[] is deprecated.
   *
   * @param tokens - The input tokens.
   * @param encoderOutput - The encoder output.
   * @returns Decoded output.
   */
  public async decode(
    tokens: Int32Array | number[],
    encoderOutput: Float32Array | number[]
  ): Promise<Float32Array> {
    if (Array.isArray(tokens)) {
      Logger.info(
        'Passing tokens as number[] is deprecated, use Int32Array instead'
      );
      tokens = new Int32Array(tokens);
    }
    if (Array.isArray(encoderOutput)) {
      Logger.info(
        'Passing encoderOutput as number[] is deprecated, use Float32Array instead'
      );
      encoderOutput = new Float32Array(encoderOutput);
    }
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
    waveform: Float32Array | number[],
    options: DecodingOptions = {}
  ): Promise<string> {
    this.validateOptions(options);

    if (Array.isArray(waveform)) {
      Logger.info(
        'Passing waveform as number[] is deprecated, use Float32Array instead'
      );
      waveform = new Float32Array(waveform);
    }
    const transcriptionBytes = await this.nativeModule.transcribe(
      waveform,
      options.language || ''
    );
    return this.textDecoder.decode(new Uint8Array(transcriptionBytes));
  }

  /**
   * Starts a streaming transcription session. 
   * Yields objects with `committed` and `nonCommitted` transcriptions. 
   * Use with `streamInsert` and `streamStop` to control the stream.
   * 
   * @param options - Decoding options including language.
   * @returns An async generator yielding transcription updates.
   */
  public async *stream(
    options: DecodingOptions = {}
  ): AsyncGenerator<{ committed: string; nonCommitted: string }> {
    this.validateOptions(options);

    const queue: { committed: string; nonCommitted: string }[] = [];
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
          (committed: number[], nonCommitted: number[], isDone: boolean) => {
            queue.push({
              committed: this.textDecoder.decode(new Uint8Array(committed)),
              nonCommitted: this.textDecoder.decode(
                new Uint8Array(nonCommitted)
              ),
            });
            if (isDone) {
              finished = true;
            }
            wake();
          },
          options.language || ''
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
   * Inserts a new audio chunk into the streaming transcription session. Passing `number[]` is deprecated.
   * 
   * @param waveform - The audio chunk to insert.
   */
  public streamInsert(waveform: Float32Array | number[]): void {
    if (Array.isArray(waveform)) {
      Logger.info(
        'Passing waveform as number[] is deprecated, use Float32Array instead'
      );
      waveform = new Float32Array(waveform);
    }
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
