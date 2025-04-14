import { symbols } from '../constants/ocr/symbols';
import { ETError, getError } from '../Error';
import { _OCRModule } from '../native/RnExecutorchModules';
import { ResourceSource } from '../types/common';
import { OCRLanguage } from '../types/ocr';
import {
  fetchResource,
  calculateDownloadProgress,
} from '../utils/fetchResource';

export class OCRController {
  private nativeModule: _OCRModule;
  public isReady: boolean = false;
  public isGenerating: boolean = false;
  public error: string | null = null;
  private modelDownloadProgressCallback: (downloadProgress: number) => void;
  private isReadyCallback: (isReady: boolean) => void;
  private isGeneratingCallback: (isGenerating: boolean) => void;
  private errorCallback: (error: string) => void;

  constructor({
    modelDownloadProgressCallback = (_downloadProgress: number) => {},
    isReadyCallback = (_isReady: boolean) => {},
    isGeneratingCallback = (_isGenerating: boolean) => {},
    errorCallback = (_error: string) => {},
  }) {
    this.nativeModule = new _OCRModule();
    this.modelDownloadProgressCallback = modelDownloadProgressCallback;
    this.isReadyCallback = isReadyCallback;
    this.isGeneratingCallback = isGeneratingCallback;
    this.errorCallback = errorCallback;
  }

  public loadModel = async (
    detectorSource: ResourceSource,
    recognizerSources: {
      recognizerLarge: ResourceSource;
      recognizerMedium: ResourceSource;
      recognizerSmall: ResourceSource;
    },
    language: OCRLanguage
  ) => {
    try {
      if (!detectorSource || Object.keys(recognizerSources).length !== 3)
        return;

      if (!symbols[language]) {
        throw new Error(getError(ETError.LanguageNotSupported));
      }
      this.isReady = false;
      this.isReadyCallback(false);

      const detectorPath = await fetchResource(
        detectorSource,
        calculateDownloadProgress(4, 0, this.modelDownloadProgressCallback)
      );

      const recognizerPaths = {
        recognizerLarge: await fetchResource(
          recognizerSources.recognizerLarge,
          calculateDownloadProgress(4, 1, this.modelDownloadProgressCallback)
        ),
        recognizerMedium: await fetchResource(
          recognizerSources.recognizerMedium,
          calculateDownloadProgress(4, 2, this.modelDownloadProgressCallback)
        ),
        recognizerSmall: await fetchResource(
          recognizerSources.recognizerSmall,
          calculateDownloadProgress(4, 3, this.modelDownloadProgressCallback)
        ),
      };

      await this.nativeModule.loadModule(
        detectorPath,
        recognizerPaths.recognizerLarge,
        recognizerPaths.recognizerMedium,
        recognizerPaths.recognizerSmall,
        symbols[language]
      );

      this.isReady = true;
      this.isReadyCallback(this.isReady);
    } catch (e) {
      if (this.errorCallback) {
        this.errorCallback(getError(e));
      } else {
        throw new Error(getError(e));
      }
    }
  };

  public forward = async (input: string) => {
    if (!this.isReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    if (this.isGenerating) {
      throw new Error(getError(ETError.ModelGenerating));
    }

    try {
      this.isGenerating = true;
      this.isGeneratingCallback(this.isGenerating);
      return await this.nativeModule.forward(input);
    } catch (e) {
      throw new Error(getError(e));
    } finally {
      this.isGenerating = false;
      this.isGeneratingCallback(this.isGenerating);
    }
  };
}
