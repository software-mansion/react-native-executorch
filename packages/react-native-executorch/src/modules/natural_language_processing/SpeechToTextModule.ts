import { Logger } from '../../common/Logger';
import { DecodingOptions, SpeechToTextModelConfig } from '../../types/stt';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

export interface Word {
  word: string;
  start: number;
  end: number;
}

export class SpeechToTextModule {
  private nativeModule: any;
  private modelConfig!: SpeechToTextModelConfig;

  private textDecoder = new TextDecoder('utf-8', {
    fatal: false,
    ignoreBOM: true,
  });

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

  public delete(): void {
    this.nativeModule.unload();
  }

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

  public async transcribe(
    waveform: Float32Array | number[],
    options?: DecodingOptions & { enableTimestamps: true }
  ): Promise<Word[]>;

  public async transcribe(
    waveform: Float32Array | number[],
    options?: DecodingOptions & { enableTimestamps?: false | undefined }
  ): Promise<string>;

  public async transcribe(
    waveform: Float32Array | number[],
    options: DecodingOptions = {}
  ): Promise<string | Word[]> {
    this.validateOptions(options);

    if (Array.isArray(waveform)) {
      Logger.info(
        'Passing waveform as number[] is deprecated, use Float32Array instead'
      );
      waveform = new Float32Array(waveform);
    }

    const language = options.language || '';

    if (options.enableTimestamps) {
      return await this.nativeModule.transcribe(waveform, language);
    } else {
      const transcriptionBytes = await this.nativeModule.transcribeStringOnly(
        waveform,
        language
      );

      return this.textDecoder.decode(new Uint8Array(transcriptionBytes));
    }
  }

  public stream(
    options: DecodingOptions & { enableTimestamps: true }
  ): AsyncGenerator<{ committed: Word[]; nonCommitted: Word[] }>;

  public stream(
    options?: DecodingOptions & { enableTimestamps?: false | undefined }
  ): AsyncGenerator<{ committed: string; nonCommitted: string }>;

  public async *stream(options: DecodingOptions = {}): AsyncGenerator<{
    committed: string | Word[];
    nonCommitted: string | Word[];
  }> {
    this.validateOptions(options);

    const enableTimestamps = options.enableTimestamps === true;

    const queue: {
      committed: string | Word[];
      nonCommitted: string | Word[];
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
        const callback = (
          committed: any,
          nonCommitted: any,
          isDone: boolean
        ) => {
          if (!enableTimestamps) {
            try {
              queue.push({
                committed: this.textDecoder.decode(new Uint8Array(committed)),
                nonCommitted: this.textDecoder.decode(
                  new Uint8Array(nonCommitted)
                ),
              });
            } catch (err) {
              console.error('[Stream Decode Error]', err);
            }
          } else {
            queue.push({ committed, nonCommitted });
          }

          if (isDone) finished = true;
          wake();
        };

        const language = options.language || '';

        await this.nativeModule.stream(callback, language, enableTimestamps);

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

  public streamInsert(waveform: Float32Array | number[]): void {
    if (Array.isArray(waveform)) {
      Logger.info(
        'Passing waveform as number[] is deprecated, use Float32Array instead'
      );
      waveform = new Float32Array(waveform);
    }
    this.nativeModule.streamInsert(waveform);
  }

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
