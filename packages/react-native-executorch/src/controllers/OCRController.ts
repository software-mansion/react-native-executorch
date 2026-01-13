import { symbols } from '../constants/ocr/symbols';
import { ETErrorCode } from '../errors/ErrorCodes';
import { ExecutorchError, parseUnknownError } from '../errors/errorUtils';
import { ResourceSource } from '../types/common';
import { OCRLanguage } from '../types/ocr';
import { ResourceFetcher } from '../utils/ResourceFetcher';

export class OCRController {
  private nativeModule: any;
  public isReady: boolean = false;
  public isGenerating: boolean = false;
  public error: string | null = null;
  private isReadyCallback: (isReady: boolean) => void;
  private isGeneratingCallback: (isGenerating: boolean) => void;
  private errorCallback: (error: string) => void;

  constructor({
    isReadyCallback = (_isReady: boolean) => {},
    isGeneratingCallback = (_isGenerating: boolean) => {},
    errorCallback = (_error: string) => {},
  } = {}) {
    this.isReadyCallback = isReadyCallback;
    this.isGeneratingCallback = isGeneratingCallback;
    this.errorCallback = errorCallback;
  }

  public load = async (
    detectorSource: ResourceSource,
    recognizerSource: ResourceSource,
    language: OCRLanguage,
    onDownloadProgressCallback?: (downloadProgress: number) => void
  ) => {
    try {
      if (!detectorSource || !recognizerSource) return;

      if (!symbols[language]) {
        throw new ExecutorchError(
          ETErrorCode.LanguageNotSupported,
          'The provided language for OCR is not supported. Please try using other language.'
        );
      }

      this.isReady = false;
      this.isReadyCallback(false);

      const paths = await ResourceFetcher.fetch(
        onDownloadProgressCallback,
        detectorSource,
        recognizerSource
      );
      if (paths === null || paths.length < 2) {
        throw new Error('Download interrupted!');
      }
      this.nativeModule = global.loadOCR(
        paths[0]!,
        paths[1]!,
        symbols[language]
      );
      this.isReady = true;
      this.isReadyCallback(this.isReady);
    } catch (e) {
      if (this.errorCallback) {
        // NOTE: maybe we should set the error to an actual error instead of string?
        this.errorCallback(parseUnknownError(e).message);
      } else {
        throw parseUnknownError(e);
      }
    }
  };

  public forward = async (imageSource: string) => {
    if (!this.isReady) {
      throw new ExecutorchError(
        ETErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    }
    if (this.isGenerating) {
      throw new ExecutorchError(
        ETErrorCode.ModelGenerating,
        'The model is currently generating. Please wait until previous model run is complete.'
      );
    }

    try {
      this.isGenerating = true;
      this.isGeneratingCallback(this.isGenerating);
      return await this.nativeModule.generate(imageSource);
    } catch (e) {
      throw parseUnknownError(e);
    } finally {
      this.isGenerating = false;
      this.isGeneratingCallback(this.isGenerating);
    }
  };

  public delete() {
    if (this.isGenerating) {
      throw new ExecutorchError(
        ETErrorCode.ModelGenerating,
        'The model is currently generating. Please wait until previous model run is complete.'
      );
    }
    this.nativeModule.unload();
    this.isReadyCallback(false);
    this.isGeneratingCallback(false);
  }
}
