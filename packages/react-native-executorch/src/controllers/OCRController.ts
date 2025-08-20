import { symbols } from '../constants/ocr/symbols';
import { ETError, getError } from '../Error';
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
    recognizerSources: {
      recognizerLarge: ResourceSource;
      recognizerMedium: ResourceSource;
      recognizerSmall: ResourceSource;
    },
    language: OCRLanguage,
    onDownloadProgressCallback?: (downloadProgress: number) => void
  ) => {
    try {
      if (!detectorSource || Object.keys(recognizerSources).length !== 3)
        return;

      if (!symbols[language]) {
        throw new Error(getError(ETError.LanguageNotSupported));
      }

      this.isReady = false;
      this.isReadyCallback(false);

      const paths = await ResourceFetcher.fetch(
        onDownloadProgressCallback,
        detectorSource,
        recognizerSources.recognizerLarge,
        recognizerSources.recognizerMedium,
        recognizerSources.recognizerSmall
      );
      if (paths === null || paths?.length < 4) {
        throw new Error('Download interrupted!');
      }
      this.nativeModule = global.loadOCR(
        paths[0]!,
        paths[1]!,
        paths[2]!,
        paths[3]!,
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
      return await this.nativeModule.generate(input);
    } catch (e) {
      throw new Error(getError(e));
    } finally {
      this.isGenerating = false;
      this.isGeneratingCallback(this.isGenerating);
    }
  };

  public delete() {
    if (this.isGenerating) {
      throw new Error(
        getError(ETError.ModelGenerating) +
          'You cannot delete the model. You must wait until the generating is finished.'
      );
    }
    this.nativeModule.unload();
    this.isReadyCallback(false);
    this.isGeneratingCallback(false);
  }
}
