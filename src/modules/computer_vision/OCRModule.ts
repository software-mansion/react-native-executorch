import { languageDicts } from '../../constants/ocr/languageDicts';
import { symbols } from '../../constants/ocr/symbols';
import { getError, ETError } from '../../Error';
import { OCR } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { fetchResource } from '../../utils/fetchResource';

export class OCRModule {
  static onDownloadProgressCallback = (_downloadProgress: number) => {};

  static async load(
    detectorSource: ResourceSource,
    recognizerSources: {
      recognizerLarge: ResourceSource;
      recognizerMedium: ResourceSource;
      recognizerSmall: ResourceSource;
    },
    language = 'en'
  ) {
    try {
      if (!detectorSource || Object.keys(recognizerSources).length === 0)
        return;

      const recognizerPaths = {} as {
        recognizerLarge: string;
        recognizerMedium: string;
        recognizerSmall: string;
      };

      if (!symbols[language] || !languageDicts[language]) {
        throw new Error(getError(ETError.LanguageNotSupported));
      }

      const detectorPath = await fetchResource(detectorSource);

      await Promise.all([
        fetchResource(
          recognizerSources.recognizerLarge,
          this.onDownloadProgressCallback
        ),
        fetchResource(recognizerSources.recognizerMedium),
        fetchResource(recognizerSources.recognizerSmall),
      ]).then((values) => {
        recognizerPaths.recognizerLarge = values[0];
        recognizerPaths.recognizerMedium = values[1];
        recognizerPaths.recognizerSmall = values[2];
      });

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
