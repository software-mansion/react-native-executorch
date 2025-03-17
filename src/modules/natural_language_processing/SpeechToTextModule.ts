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
    preset?: ConstructorParameters<typeof SpeechToTextController>['0']['preset']
  ) {
    this.module = new SpeechToTextController({
      transcribeCallback: transcribeCallback,
      modelDownloadProgessCallback: modelDownloadProgessCallback,
      overlapSeconds: overlapSeconds,
      windowSize: windowSize,
      preset: preset,
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
    return await this.module.transcribe(waveform);
  }

  static async loadAudio(
    url: string
  ): ReturnType<SpeechToTextController['loadAudio']> {
    return await this.module.loadAudio(url);
  }
}
