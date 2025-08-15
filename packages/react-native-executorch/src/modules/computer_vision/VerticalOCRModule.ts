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
      detectorLarge: ResourceSource;
      detectorNarrow: ResourceSource;
      recognizerLarge: ResourceSource;
      recognizerSmall: ResourceSource;
      language: OCRLanguage;
    },
    independentCharacters: boolean,
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ) {
    await this.controller.load(
      {
        detectorLarge: model.detectorLarge,
        detectorNarrow: model.detectorNarrow,
      },
      {
        recognizerLarge: model.recognizerLarge,
        recognizerSmall: model.recognizerSmall,
      },
      model.language,
      independentCharacters,
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
