import { Logger } from '../../common/Logger';
import { DecodingOptions, SpeechToTextModelConfig } from '../../types/stt';
import { ResourceFetcher } from '../../utils/ResourceFetcher';

export class SpeechToTextModule {
  private nativeModule: any;

  private modelConfig!: SpeechToTextModelConfig;

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
      throw new Error('Download interrupted.');
    }
    this.nativeModule = await global.loadSpeechToText(
      encoderSource,
      decoderSource,
      tokenizerSources[0]!
    );
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
    options: DecodingOptions = {}
  ): Promise<string> {
    this.validateOptions(options);

    if (Array.isArray(waveform)) {
      Logger.info(
        'Passing waveform as number[] is deprecated, use Float32Array instead'
      );
      waveform = new Float32Array(waveform);
    }

    return this.nativeModule.transcribe(waveform, options.language || '');
  }

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
          (committed: string, nonCommitted: string, isDone: boolean) => {
            queue.push({ committed, nonCommitted });
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
      if (error) throw error;
      if (finished) return;
      await new Promise<void>((r) => (waiter = r));
    }
  }

  public async streamInsert(waveform: Float32Array | number[]): Promise<void> {
    if (Array.isArray(waveform)) {
      Logger.info(
        'Passing waveform as number[] is deprecated, use Float32Array instead'
      );
      waveform = new Float32Array(waveform);
    }
    return this.nativeModule.streamInsert(waveform);
  }

  public async streamStop(): Promise<void> {
    return this.nativeModule.streamStop();
  }

  private validateOptions(options: DecodingOptions) {
    if (!this.modelConfig.isMultilingual && options.language) {
      throw new Error('Model is not multilingual, cannot set language');
    }
    if (this.modelConfig.isMultilingual && !options.language) {
      throw new Error('Model is multilingual, provide a language');
    }
  }
}
