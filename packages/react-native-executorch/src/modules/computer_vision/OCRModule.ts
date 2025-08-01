import { OCRController } from '../../controllers/OCRController';
import { ResourceSource } from '../../types/common';
import { OCRLanguage } from '../../types/ocr';

export class OCRModule {
  static module: OCRController;

  static onDownloadProgressCallback = (_downloadProgress: number) => {};

  static async load(
    detectorSource: ResourceSource,
    recognizerSources: {
      recognizerLarge: ResourceSource;
      recognizerMedium: ResourceSource;
      recognizerSmall: ResourceSource;
    },
    language: OCRLanguage = 'en'
  ) {
    this.module = new OCRController({
      modelDownloadProgressCallback: this.onDownloadProgressCallback,
    });

    await this.module.load(detectorSource, recognizerSources, language);
  }

  static async forward(input: string) {
    return await this.module.forward(input);
  }

  static onDownloadProgress(callback: (downloadProgress: number) => void) {
    this.onDownloadProgressCallback = callback;
  }
}
