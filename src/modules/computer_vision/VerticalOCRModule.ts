import { symbols } from '../../constants/ocr/symbols';
import { getError, ETError } from '../../Error';
import { VerticalOCR } from '../../native/RnExecutorchModules';
import { ResourceSource } from '../../types/common';
import { OCRLanguage } from '../../types/ocr';
import {
  calculateDownloadProgres,
  fetchResource,
} from '../../utils/fetchResource';

export class VerticalOCRModule {
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
    try {
      if (
        Object.keys(detectorSources).length !== 2 ||
        Object.keys(recognizerSources).length !== 2
      )
        return;

      if (!symbols[language]) {
        throw new Error(getError(ETError.LanguageNotSupported));
      }

      const recognizerPath = independentCharacters
        ? await fetchResource(
            recognizerSources.recognizerSmall,
            calculateDownloadProgres(3, 0, this.onDownloadProgressCallback)
          )
        : await fetchResource(
            recognizerSources.recognizerLarge,
            calculateDownloadProgres(3, 0, this.onDownloadProgressCallback)
          );

      const detectorPaths = {
        detectorLarge: await fetchResource(
          detectorSources.detectorLarge,
          calculateDownloadProgres(3, 1, this.onDownloadProgressCallback)
        ),
        detectorNarrow: await fetchResource(
          detectorSources.detectorNarrow,
          calculateDownloadProgres(3, 2, this.onDownloadProgressCallback)
        ),
      };

      await VerticalOCR.loadModule(
        detectorPaths.detectorLarge,
        detectorPaths.detectorNarrow,
        recognizerPath,
        symbols[language],
        independentCharacters
      );
    } catch (e) {
      throw new Error(getError(e));
    }
  }

  static async forward(input: string) {
    try {
      return await VerticalOCR.forward(input);
    } catch (e) {
      throw new Error(getError(e));
    }
  }

  static onDownloadProgress(callback: (downloadProgress: number) => void) {
    this.onDownloadProgressCallback = callback;
  }
}
