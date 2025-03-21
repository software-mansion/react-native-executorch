import { ResourceSource } from '../../types/common';
import { SpeechToTextController } from '../../controllers/SpeechToTextController';
import { availableModels } from '../../constants/sttDefaults';

export class SpeechToText {
  static module: SpeechToTextController;

  static onDownloadProgressCallback = (_downloadProgress: number) => {};

  static async load(
    modelName: availableModels,
    transcribeCallback: (sequence: string) => void,
    modelDownloadProgessCallback?: (downloadProgress: number) => void,
    encoderSource?: ResourceSource,
    decoderSource?: ResourceSource,
    tokenizerSource?: ResourceSource
  ) {
    this.module = new SpeechToTextController({
      transcribeCallback: transcribeCallback,
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
    waveform: number[],
    speakerLanguage: any
  ): ReturnType<SpeechToTextController['transcribe']> {
    return await this.module.transcribe(waveform, speakerLanguage);
  }

  static async loadAudio(
    url: string
  ): ReturnType<SpeechToTextController['loadAudio']> {
    return await this.module.loadAudio(url);
  }
}
