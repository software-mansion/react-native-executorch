import { ResourceSource } from '../../types/common';
import { SpeechToTextController } from '../../controllers/SpeechToTextController';

export class SpeechToText {
  static module: SpeechToTextController;

  static onDownloadProgressCallback = (_downloadProgress: number) => {};

  static async load(
    modelName: 'moonshine' | 'whisper',
    transcribeCallback: (sequence: string) => void,
    modelDownloadProgessCallback?: (downloadProgress: number) => void,
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
      modelDownloadProgessCallback: modelDownloadProgessCallback,
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

  static async transcribe(
    waveform: number[]
  ): ReturnType<SpeechToTextController['transcribe']> {
    return await this.module.transcribe(waveform);
  }

  static async encode(waveform: number[]) {
    return await this.module.encode(waveform);
  }

  static async decode(seq: number[], encodings?: number[]) {
    return await this.module.decode(seq, encodings);
  }
}
