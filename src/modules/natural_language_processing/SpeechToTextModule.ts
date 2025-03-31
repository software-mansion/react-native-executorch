import { ResourceSource } from '../../types/common';
import { SpeechToTextController } from '../../controllers/SpeechToTextController';
import { AvailableModels } from '../../types/stt';

export class SpeechToText {
  static module: SpeechToTextController;

  static onDownloadProgressCallback = (_downloadProgress: number) => {};

  static async load(
    modelName: AvailableModels,
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
    waveform: number[],
    targetLanguage?: string
  ): ReturnType<SpeechToTextController['transcribe']> {
    return await this.module.transcribe(waveform, targetLanguage);
  }
}
