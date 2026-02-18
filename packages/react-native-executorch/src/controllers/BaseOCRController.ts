import { Logger } from '../common/Logger';
import { symbols } from '../constants/ocr/symbols';
import { RnExecutorchErrorCode } from '../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../errors/errorUtils';
import { ResourceSource } from '../types/common';
import { OCRLanguage, OCRDetection } from '../types/ocr';
import { ResourceFetcher } from '../utils/ResourceFetcher';

export abstract class BaseOCRController {
  protected nativeModule: any;
  public isReady: boolean = false;
  public isGenerating: boolean = false;
  public error: RnExecutorchError | null = null;
  protected isReadyCallback: (isReady: boolean) => void;
  protected isGeneratingCallback: (isGenerating: boolean) => void;
  protected errorCallback: (error: RnExecutorchError) => void;

  constructor({
    isReadyCallback = (_isReady: boolean) => {},
    isGeneratingCallback = (_isGenerating: boolean) => {},
    errorCallback = (_error: RnExecutorchError) => {},
  } = {}) {
    this.isReadyCallback = isReadyCallback;
    this.isGeneratingCallback = isGeneratingCallback;
    this.errorCallback = errorCallback;
  }

  protected abstract loadNativeModule(
    detectorPath: string,
    recognizerPath: string,
    language: OCRLanguage,
    extraParams?: any
  ): any;

  protected internalLoad = async (
    detectorSource: ResourceSource,
    recognizerSource: ResourceSource,
    language: OCRLanguage,
    onDownloadProgressCallback?: (downloadProgress: number) => void,
    extraParams?: any
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
      this.isReadyCallback(false);

      const paths = await ResourceFetcher.fetch(
        onDownloadProgressCallback,
        detectorSource,
        recognizerSource
      );
      if (paths === null || paths.length < 2) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.DownloadInterrupted,
          'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
        );
      }
      this.nativeModule = this.loadNativeModule(
        paths[0]!,
        paths[1]!,
        language,
        extraParams
      );
      this.isReady = true;
      this.isReadyCallback(this.isReady);
    } catch (e) {
      if (
        e &&
        typeof e === 'object' &&
        'code' in e &&
        e.code == RnExecutorchErrorCode.NotImplemented
      ) {
        Logger.error('Load failed:', e);
      } else if (this.errorCallback) {
        this.errorCallback(parseUnknownError(e));
      } else {
        throw parseUnknownError(e);
      }
    }
  };

  public forward = async (imageSource: string): Promise<OCRDetection[]> => {
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
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModelGenerating,
        'The model is currently generating. Please wait until previous model run is complete.'
      );
    }
    if (this.nativeModule) {
      this.nativeModule.unload();
    }
    this.isReadyCallback(false);
    this.isGeneratingCallback(false);
  }
}
