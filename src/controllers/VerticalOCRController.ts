import { symbols } from '../constants/ocr/symbols';
import { ETError, getError } from '../Error';
import { _VerticalOCRModule } from '../native/RnExecutorchModules';
import { ResourceSource } from '../types/common';
import { OCRLanguage } from '../types/ocr';
import { ResourceFetcher } from '../utils/ResourceFetcher';

export class VerticalOCRController {
  private nativeModule: _VerticalOCRModule;
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
    this.nativeModule = new _VerticalOCRModule();
    this.modelDownloadProgressCallback = modelDownloadProgressCallback;
    this.isReadyCallback = isReadyCallback;
    this.isGeneratingCallback = isGeneratingCallback;
    this.errorCallback = errorCallback;
  }

  public loadModel = async (
    detectorSources: {
      detectorLarge: ResourceSource;
      detectorNarrow: ResourceSource;
    },
    recognizerSources: {
      recognizerLarge: ResourceSource;
      recognizerSmall: ResourceSource;
    },
    language: OCRLanguage,
    independentCharacters: boolean
  ) => {
    try {
      if (
        Object.keys(detectorSources).length !== 2 ||
        Object.keys(recognizerSources).length !== 2
      )
        return;

      if (!symbols[language]) {
        throw new Error(getError(ETError.LanguageNotSupported));
      }

      this.isReady = false;
      this.isReadyCallback(this.isReady);

      const recognizerPath = independentCharacters
        ? await ResourceFetcher.fetch(
            recognizerSources.recognizerSmall,
            ResourceFetcher.calculateDownloadProgress(
              3,
              0,
              this.modelDownloadProgressCallback
            )
          )
        : await ResourceFetcher.fetch(
            recognizerSources.recognizerLarge,
            ResourceFetcher.calculateDownloadProgress(
              3,
              0,
              this.modelDownloadProgressCallback
            )
          );

      const detectorPaths = {
        detectorLarge: await ResourceFetcher.fetch(
          detectorSources.detectorLarge,
          ResourceFetcher.calculateDownloadProgress(
            3,
            1,
            this.modelDownloadProgressCallback
          )
        ),
        detectorNarrow: await ResourceFetcher.fetch(
          detectorSources.detectorNarrow,
          ResourceFetcher.calculateDownloadProgress(
            3,
            2,
            this.modelDownloadProgressCallback
          )
        ),
      };

      await this.nativeModule.loadModule(
        detectorPaths.detectorLarge,
        detectorPaths.detectorNarrow,
        recognizerPath,
        symbols[language],
        independentCharacters
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
