import { VerticalOCRController } from '../../controllers/VerticalOCRController';
import { ResourceSource } from '../../types/common';
import { OCRLanguage } from '../../types/ocr';

export class VerticalOCRModule {
  private controller: VerticalOCRController;

  constructor() {
    this.controller = new VerticalOCRController();
  }

  async load(
    model: {
      detectorSource: ResourceSource;
      recognizerSource: ResourceSource;
      language: OCRLanguage;
    },
    independentCharacters: boolean,
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ) {
    await this.controller.load(
      model.detectorSource,
      model.recognizerSource,
      model.language,
      independentCharacters,
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
