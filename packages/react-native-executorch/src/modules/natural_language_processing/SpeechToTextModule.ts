import { ResourceSource } from '../../types/common';
import { SpeechToTextController } from '../../controllers/SpeechToTextController';
import { AvailableModels, SpeechToTextLanguage } from '../../types/stt';
import { STREAMING_ACTION } from '../../constants/sttDefaults';

export class SpeechToTextModule {
  static module: SpeechToTextController;

  static onDownloadProgressCallback = (_downloadProgress: number) => {};

  static async load(
    modelName: AvailableModels,
    transcribeCallback: (sequence: string) => void,
    modelDownloadProgressCallback?: (downloadProgress: number) => void,
    encoderSource?: ResourceSource,
    decoderSource?: ResourceSource,
    tokenizerSource?: ResourceSource,
    overlapSeconds?: ConstructorParameters<
      typeof SpeechToTextController
    >['0']['overlapSeconds'],
    windowSize?: ConstructorParameters<
      typeof SpeechToTextController
    >['0']['windowSize'],
    streamingConfig?: ConstructorParameters<
      typeof SpeechToTextController
    >['0']['streamingConfig']
  ) {
    this.module = new SpeechToTextController({
      transcribeCallback: transcribeCallback,
      modelDownloadProgressCallback: modelDownloadProgressCallback,
      overlapSeconds: overlapSeconds,
      windowSize: windowSize,
      streamingConfig: streamingConfig,
    });
    await this.module.loadModel(
      (modelName = modelName),
      (encoderSource = encoderSource),
      (decoderSource = decoderSource),
      (tokenizerSource = tokenizerSource)
    );
  }

  static configureStreaming(
    overlapSeconds: Parameters<SpeechToTextController['configureStreaming']>[0],
    windowSize: Parameters<SpeechToTextController['configureStreaming']>[1],
    streamingConfig: Parameters<SpeechToTextController['configureStreaming']>[2]
  ) {
    this.module?.configureStreaming(
      overlapSeconds,
      windowSize,
      streamingConfig
    );
  }

  static async encode(waveform: Float32Array) {
    return await this.module.encode(waveform);
  }

  static async decode(seq: number[]) {
    return await this.module.decode(seq);
  }

  static async transcribe(
    waveform: number[],
    audioLanguage?: SpeechToTextLanguage
  ): ReturnType<SpeechToTextController['transcribe']> {
    return await this.module.transcribe(waveform, audioLanguage);
  }

  static async streamingTranscribe(
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
