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
      recognizerSource: ResourceSource;
      language: OCRLanguage;
    },
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ) {
    await this.controller.load(
      model.detectorSource,
      model.recognizerSource,
      model.language,
      onDownloadProgressCallback
    );
  }

  async forward(imageSource: string) {
    return await this.controller.forward(imageSource);
  }

  delete() {
    this.controller.delete();
  }
}
