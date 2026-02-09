import { symbols } from '../constants/ocr/symbols';
import { ResourceSource } from '../types/common';
import { OCRLanguage } from '../types/ocr';
import { BaseOCRController } from './BaseOCRController';

export class VerticalOCRController extends BaseOCRController {
  protected loadNativeModule(
    detectorPath: string,
    recognizerPath: string,
    language: OCRLanguage,
    independentCharacters?: boolean
  ): any {
    return global.loadVerticalOCR(
      detectorPath,
      recognizerPath,
      symbols[language],
      independentCharacters
    );
  }

  public load = async (
    detectorSource: ResourceSource,
    recognizerSource: ResourceSource,
    language: OCRLanguage,
    independentCharacters: boolean,
    onDownloadProgressCallback: (downloadProgress: number) => void
  ) => {
    await this.internalLoad(
      detectorSource,
      recognizerSource,
      language,
      onDownloadProgressCallback,
      independentCharacters
    );
  };
}
