import { DecodingOptions, SpeechToTextModelConfig } from '../../types/stt';
import { ASR } from '../../utils/SpeechToTextModule/ASR';
import { OnlineASRProcessor } from '../../utils/SpeechToTextModule/OnlineProcessor';

export class SpeechToTextModule {
  private modelConfig!: SpeechToTextModelConfig;
  private asr: ASR = new ASR();

  private processor: OnlineASRProcessor = new OnlineASRProcessor(this.asr);
  private isStreaming = false;
  private readyToProcess = false;
  private minAudioSamples: number = 1 * 16000; // 1 second

  public async load(
    model: SpeechToTextModelConfig,
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ) {
    this.modelConfig = model;
    return this.asr.load(model, onDownloadProgressCallback);
  }

  public async encode(waveform: Float32Array): Promise<void> {
    return this.asr.encode(waveform);
  }

  public async decode(tokens: number[]): Promise<Float32Array> {
    return this.asr.decode(tokens);
  }

  public async transcribe(
    waveform: number[],
    options: DecodingOptions = {}
  ): Promise<string> {
    this.validateOptions(options);

    const segments = await this.asr.transcribe(waveform, options);

    let transcription = '';
    for (const segment of segments) {
      for (const word of segment.words) {
        transcription += ` ${word.word}`;
      }
    }

    return transcription.trim();
  }

  public async *stream(options: DecodingOptions = {}) {
    if (this.isStreaming) {
      throw new Error('Streaming is already in progress');
    }
    this.validateOptions(options);
    this.resetStreamState();

    this.isStreaming = true;
    while (this.isStreaming) {
      if (
        !this.readyToProcess ||
        this.processor.audioBuffer.length < this.minAudioSamples
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      const { committed, nonCommitted } =
        await this.processor.processIter(options);
      yield { committed, nonCommitted };
      this.readyToProcess = false;
    }

    const { committed } = await this.processor.finish();
    yield { committed, nonCommitted: '' };
  }

  public streamStop() {
    this.isStreaming = false;
  }

  public streamInsert(waveform: number[]) {
    this.processor.insertAudioChunk(waveform);
    this.readyToProcess = true;
  }

  private validateOptions(options: DecodingOptions) {
    if (!this.modelConfig.isMultilingual && options.language) {
      throw new Error('Model is not multilingual, cannot set language');
    }
    if (this.modelConfig.isMultilingual && !options.language) {
      throw new Error('Model is multilingual, provide a language');
    }
  }

  private resetStreamState() {
    this.isStreaming = false;
    this.readyToProcess = false;
    this.processor = new OnlineASRProcessor(this.asr);
  }
}
