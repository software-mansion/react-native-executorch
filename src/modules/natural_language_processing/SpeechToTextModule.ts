import { ResourceSource } from '../../types/common';
import { SpeechToTextController } from '../../controllers/SpeechToTextController';

export class SpeechToText {
  static module: SpeechToTextController;

  static onDownloadProgressCallback = (_downloadProgress: number) => {};

  static async load(
    modelName: 'moonshine' | 'whisper',
    transribeCallback: (sequence: number[]) => void,
    modelDownloadProgessCallback?: (downloadProgress: number) => void,
    encoderSource?: ResourceSource,
    decoderSource?: ResourceSource,
    tokenizerSource?: ResourceSource
  ) {
    this.module = new SpeechToTextController({
      transribeCallback: transribeCallback,
      modelDownloadProgessCallback: modelDownloadProgessCallback,
    });
    await this.module.loadModel(
      (modelName = modelName),
      (encoderSource = encoderSource),
      (decoderSource = decoderSource),
      (tokenizerSource = tokenizerSource)
    );
  }

  static async transcribe(
    waveform: number[]
  ): ReturnType<SpeechToTextController['transcribe']> {
    return this.module.transcribe(waveform);
  }

  static async loadAudio(
    url: string
  ): ReturnType<SpeechToTextController['loadAudio']> {
    return this.module.loadAudio(url);
  }
}
