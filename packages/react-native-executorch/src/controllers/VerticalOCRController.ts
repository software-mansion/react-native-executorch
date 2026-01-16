import { symbols } from '../constants/ocr/symbols';
import { RnExecutorchErrorCode } from '../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../errors/errorUtils';
import { ResourceSource } from '../types/common';
import { OCRLanguage } from '../types/ocr';
import { ResourceFetcher } from '../utils/ResourceFetcher';

export class VerticalOCRController {
  private ocrNativeModule: any;
  public isReady: boolean = false;
  public isGenerating: boolean = false;
  public error: string | null = null;
  private isReadyCallback: (isReady: boolean) => void;
  private isGeneratingCallback: (isGenerating: boolean) => void;
  private errorCallback: (error: RnExecutorchError) => void;

  constructor({
    isReadyCallback = (_isReady: boolean) => {},
    isGeneratingCallback = (_isGenerating: boolean) => {},
    errorCallback = (_error: RnExecutorchError) => {},
  } = {}) {
    this.isReadyCallback = isReadyCallback;
    this.isGeneratingCallback = isGeneratingCallback;
    this.errorCallback = errorCallback;
  }

  public load = async (
    detectorSource: ResourceSource,
    recognizerSource: ResourceSource,
    language: OCRLanguage,
    independentCharacters: boolean,
    onDownloadProgressCallback: (downloadProgress: number) => void
  ) => {
    try {
      if (!detectorSource || !recognizerSource) return;

      if (!symbols[language]) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.LanguageNotSupported,
          'The provided language for OCR is not supported. Please try using other language.'
        );
      }

      this.isReady = false;
      this.isReadyCallback(this.isReady);

      const paths = await ResourceFetcher.fetch(
        onDownloadProgressCallback,
        detectorSource,
        recognizerSource
      );
      if (paths === null || paths.length < 3) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.DownloadInterrupted,
          'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
        );
      }
      this.ocrNativeModule = global.loadVerticalOCR(
        paths[0]!,
        paths[1]!,
        symbols[language],
        independentCharacters
      );

      this.isReady = true;
      this.isReadyCallback(this.isReady);
    } catch (e) {
      if (this.errorCallback) {
        this.errorCallback(parseUnknownError(e));
      } else {
        throw parseUnknownError(e);
      }
    }
  };

  public forward = async (imageSource: string) => {
    if (!this.isReady) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    }
    if (this.isGenerating) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModelGenerating,
        'The model is currently generating. Please wait until previous model run is complete.'
      );
    }

    try {
      this.isGenerating = true;
      this.isGeneratingCallback(this.isGenerating);
      return await this.ocrNativeModule.generate(imageSource);
    } catch (e) {
      throw parseUnknownError(e);
    } finally {
      this.isGenerating = false;
      this.isGeneratingCallback(this.isGenerating);
    }
  };

  public delete() {
    if (this.isGenerating) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModelGenerating,
        'The model is currently generating. Please wait until previous model run is complete.'
      );
    }
    this.ocrNativeModule.unload();
    this.isReadyCallback(false);
    this.isGeneratingCallback(false);
  }
}
