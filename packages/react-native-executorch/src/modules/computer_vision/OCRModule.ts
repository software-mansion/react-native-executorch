import { OCRController } from '../../controllers/OCRController';
import { ResourceSource } from '../../types/common';
import { OCRLanguage } from '../../types/ocr';

export class OCRModule {
  static module: OCRController;

  static async load(
    model: {
      detectorSource: ResourceSource;
      recognizerLarge: ResourceSource;
      recognizerMedium: ResourceSource;
      recognizerSmall: ResourceSource;
      language: OCRLanguage;
    },
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ) {
    this.module = new OCRController({
      modelDownloadProgressCallback: onDownloadProgressCallback,
    });

<<<<<<< HEAD
    await this.module.loadModel(
      model.detectorSource,
      {
        recognizerLarge: model.recognizerLarge,
        recognizerMedium: model.recognizerMedium,
        recognizerSmall: model.recognizerSmall,
      },
      model.language
    );
=======
    await this.module.load(detectorSource, recognizerSources, language);
>>>>>>> 51bb4b58 (add not working jsi bindings)
  }

  static async forward(input: string) {
    return await this.module.forward(input);
  }
}
