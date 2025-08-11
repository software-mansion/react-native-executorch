import { OCRController } from '../../controllers/OCRController';
import { ResourceSource } from '../../types/common';
import { OCRLanguage } from '../../types/ocr';

export class OCRModule {
  private controller: OCRController;

  constructor() {
    this.controller = new OCRController();
  }

  async load(
    model: {
      detectorSource: ResourceSource;
      recognizerLarge: ResourceSource;
      recognizerMedium: ResourceSource;
      recognizerSmall: ResourceSource;
      language: OCRLanguage;
    },
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ) {
    await this.controller.load(
      model.detectorSource,
      {
        recognizerLarge: model.recognizerLarge,
        recognizerMedium: model.recognizerMedium,
        recognizerSmall: model.recognizerSmall,
      },
      model.language,
      onDownloadProgressCallback
    );
  }

  async forward(input: string) {
    return await this.controller.forward(input);
  }

  delete() {
    this.controller.delete();
  }
}
