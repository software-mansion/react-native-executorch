import { ResourceSource } from '../../types/common';
import { SpeechToTextController } from '../../controllers/SpeechToTextController';
import { AvailableModels, SpeechToTextLanguage } from '../../types/stt';
import { STREAMING_ACTION } from '../../constants/sttDefaults';

export class SpeechToTextModule {
  private module: SpeechToTextController;

  constructor({
    transcribeCallback,
    overlapSeconds,
    windowSize,
    streamingConfig,
  }: {
    transcribeCallback?: (sequence: string) => void;
    overlapSeconds?: ConstructorParameters<
      typeof SpeechToTextController
    >['0']['overlapSeconds'];
    windowSize?: ConstructorParameters<
      typeof SpeechToTextController
    >['0']['windowSize'];
    streamingConfig?: ConstructorParameters<
      typeof SpeechToTextController
    >['0']['streamingConfig'];
  } = {}) {
    this.module = new SpeechToTextController({
      transcribeCallback: transcribeCallback || (() => {}),
      overlapSeconds,
      windowSize,
      streamingConfig,
    });
  }

  async load({
    modelName,
    encoderSource,
    decoderSource,
    tokenizerSource,
    onDownloadProgressCallback,
  }: {
    modelName: AvailableModels;
    encoderSource?: ResourceSource;
    decoderSource?: ResourceSource;
    tokenizerSource?: ResourceSource;
    onDownloadProgressCallback?: (downloadProgress: number) => void;
  }) {
    await this.module.load({
      modelName,
      encoderSource,
      decoderSource,
      tokenizerSource,
      onDownloadProgressCallback,
    });
  }

  configureStreaming(
    overlapSeconds: Parameters<SpeechToTextController['configureStreaming']>[0],
    windowSize: Parameters<SpeechToTextController['configureStreaming']>[1],
    streamingConfig: Parameters<SpeechToTextController['configureStreaming']>[2]
  ) {
    this.module.configureStreaming(overlapSeconds, windowSize, streamingConfig);
  }

  async encode(waveform: Float32Array) {
    return await this.module.encode(waveform);
  }

  async decode(seq: number[]) {
    return await this.module.decode(seq);
  }

  async transcribe(
    waveform: number[],
    audioLanguage?: SpeechToTextLanguage
  ): ReturnType<SpeechToTextController['transcribe']> {
    return await this.module.transcribe(waveform, audioLanguage);
  }

  async streamingTranscribe(
    streamAction: STREAMING_ACTION,
    waveform?: number[],
    audioLanguage?: SpeechToTextLanguage
  ): ReturnType<SpeechToTextController['streamingTranscribe']> {
    return await this.module.streamingTranscribe(
      streamAction,
      waveform,
      audioLanguage
    );
  }
}
