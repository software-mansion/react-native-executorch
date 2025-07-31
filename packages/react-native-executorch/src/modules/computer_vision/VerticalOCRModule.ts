import { VerticalOCRController } from '../../controllers/VerticalOCRController';
import { ResourceSource } from '../../types/common';
import { OCRLanguage } from '../../types/ocr';

export class VerticalOCRModule {
  static module: VerticalOCRController;

  static async load(
    model: {
      detectorLarge: ResourceSource;
      detectorNarrow: ResourceSource;
      recognizerLarge: ResourceSource;
      recognizerSmall: ResourceSource;
      language: OCRLanguage;
      independentCharacters: boolean;
    },
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ) {
    this.module = new VerticalOCRController({
      modelDownloadProgressCallback: onDownloadProgressCallback,
    });

    await this.module.loadModel(
      {
        detectorLarge: model.detectorLarge,
        detectorNarrow: model.detectorNarrow,
      },
      {
        recognizerLarge: model.recognizerLarge,
        recognizerSmall: model.recognizerSmall,
      },
      model.language,
      model.independentCharacters
    );
  }

  static async forward(input: string) {
    return await this.module.forward(input);
  }
}
