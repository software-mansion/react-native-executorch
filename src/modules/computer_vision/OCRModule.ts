import { symbols } from '../../constants/ocr/symbols';
import { getError, ETError } from '../../Error';
import { OCR } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { OCRLanguage } from '../../types/ocr';
import {
  calculateDownloadProgres,
  fetchResource,
} from '../../utils/fetchResource';

export class OCRModule {
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
    try {
      if (!detectorSource || Object.keys(recognizerSources).length !== 3)
        return;

      if (!symbols[language]) {
        throw new Error(getError(ETError.LanguageNotSupported));
      }

      const detectorPath = await fetchResource(
        detectorSource,
        calculateDownloadProgres(4, 0, this.onDownloadProgressCallback)
      );

      const recognizerPaths = {
        recognizerLarge: await fetchResource(
          recognizerSources.recognizerLarge,
          calculateDownloadProgres(4, 1, this.onDownloadProgressCallback)
        ),
        recognizerMedium: await fetchResource(
          recognizerSources.recognizerMedium,
          calculateDownloadProgres(4, 2, this.onDownloadProgressCallback)
        ),
        recognizerSmall: await fetchResource(
          recognizerSources.recognizerSmall,
          calculateDownloadProgres(4, 3, this.onDownloadProgressCallback)
        ),
      };

      await OCR.loadModule(
        detectorPath,
        recognizerPaths.recognizerLarge,
        recognizerPaths.recognizerMedium,
        recognizerPaths.recognizerSmall,
        symbols[language]
      );
    } catch (e) {
      throw new Error(getError(e));
    }
  }

  static async forward(input: string) {
    try {
      return await OCR.forward(input);
    } catch (e) {
      throw new Error(getError(e));
    }
  }

  static onDownloadProgress(callback: (downloadProgress: number) => void) {
    this.onDownloadProgressCallback = callback;
  }
}
