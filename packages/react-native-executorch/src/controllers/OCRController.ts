import { symbols } from '../constants/ocr/symbols';
import { ResourceSource } from '../types/common';
import { OCRLanguage } from '../types/ocr';
import { BaseOCRController } from './BaseOCRController';

export class OCRController extends BaseOCRController {
  protected loadNativeModule(
    detectorPath: string,
    recognizerPath: string,
    language: OCRLanguage
  ): any {
    return global.loadOCR(detectorPath, recognizerPath, symbols[language]);
  }

  public load = async (
    detectorSource: ResourceSource,
    recognizerSource: ResourceSource,
    language: OCRLanguage,
    onDownloadProgressCallback?: (downloadProgress: number) => void
  ) => {
    await this.internalLoad(
      detectorSource,
      recognizerSource,
      language,
      onDownloadProgressCallback
    );
  };
}
