import { symbols } from '../constants/ocr/symbols';
import { ETError, getError } from '../Error';
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
    detectorSources: {
      detectorLarge: ResourceSource;
      detectorNarrow: ResourceSource;
    },
    recognizerSources: {
      recognizerLarge: ResourceSource;
      recognizerSmall: ResourceSource;
    },
    language: OCRLanguage,
    independentCharacters: boolean,
    onDownloadProgressCallback: (downloadProgress: number) => void
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

      const paths = await ResourceFetcher.fetch(
        onDownloadProgressCallback,
        detectorSources.detectorLarge,
        detectorSources.detectorNarrow,
        independentCharacters
          ? recognizerSources.recognizerSmall
          : recognizerSources.recognizerLarge
      );
      if (paths === null || paths.length < 3) {
        throw new Error('Download interrupted');
      }
      this.ocrNativeModule = global.loadVerticalOCR(
        paths[0]!,
        paths[1]!,
        paths[2]!,
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
      return await this.ocrNativeModule.generate(input);
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
    this.ocrNativeModule.unload();
    this.isReadyCallback(false);
    this.isGeneratingCallback(false);
  }
}
