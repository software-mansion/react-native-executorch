import { VerticalOCRController } from '../../controllers/VerticalOCRController';
import { ResourceSource } from '../../types/common';
import { OCRLanguage } from '../../types/ocr';

export class VerticalOCRModule {
  static module: VerticalOCRController;

  static onDownloadProgressCallback = (_downloadProgress: number) => {};

  static async load(
    detectorSources: {
      detectorLarge: ResourceSource;
      detectorNarrow: ResourceSource;
    },
    recognizerSources: {
      recognizerLarge: ResourceSource;
      recognizerSmall: ResourceSource;
    },
    language: OCRLanguage = 'en',
    independentCharacters: boolean = false
  ) {
    this.module = new VerticalOCRController({
      modelDownloadProgressCallback: this.onDownloadProgressCallback,
    });

    await this.module.loadModel(
      detectorSources,
      recognizerSources,
      language,
      independentCharacters
    );
  }

  static async forward(input: string) {
    return await this.module.forward(input);
  }

  static onDownloadProgress(callback: (downloadProgress: number) => void) {
    this.onDownloadProgressCallback = callback;
  }
}
