import { OCRController } from '../../controllers/OCRController';
import { ResourceSource } from '../../types/common';
import { OCRDetection, OCRLanguage, OCRModelName } from '../../types/ocr';
import { Logger } from '../../common/Logger';
import { parseUnknownError } from '../../errors/errorUtils';

/**
 * Module for Optical Character Recognition (OCR) tasks.
 *
 * @category Typescript API
 */
export class OCRModule {
  private controller: OCRController;

  private constructor() {
    this.controller = new OCRController();
  }

  /**
   * Creates an OCR instance for a built-in model.
   *
   * @param namedSources - An object specifying the model name, detector source, recognizer source, and language.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to an `OCRModule` instance.
   *
   * @example
   * ```ts
   * import { OCRModule, OCR_ENGLISH } from 'react-native-executorch';
   * const ocr = await OCRModule.fromModelName(OCR_ENGLISH);
   * ```
   */
  static async fromModelName(
    namedSources: {
      modelName: OCRModelName;
      detectorSource: ResourceSource;
      recognizerSource: ResourceSource;
      language: OCRLanguage;
    },
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<OCRModule> {
    const instance = new OCRModule();
    try {
      await instance.controller.load(
        namedSources.detectorSource,
        namedSources.recognizerSource,
        namedSources.language,
        onDownloadProgress
      );
      return instance;
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Creates an OCR instance with a user-provided model binary.
   * Use this when working with a custom-exported OCR model.
   * Internally uses `'custom'` as the model name for telemetry.
   *
   * @param detectorSource - A fetchable resource pointing to the text detector model binary.
   * @param recognizerSource - A fetchable resource pointing to the text recognizer model binary.
   * @param language - The language for the OCR model.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to an `OCRModule` instance.
   */
  static fromCustomModel(
    detectorSource: ResourceSource,
    recognizerSource: ResourceSource,
    language: OCRLanguage,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<OCRModule> {
    return OCRModule.fromModelName(
      {
        modelName: `ocr-${language}` as OCRModelName,
        detectorSource,
        recognizerSource,
        language,
      },
      onDownloadProgress
    );
  }

  /**
   * Executes the model's forward pass, where `imageSource` can be a fetchable resource or a Base64-encoded string.
   *
   * @param imageSource - The image source to be processed.
   * @returns The OCR result as a `OCRDetection[]`.
   */
  async forward(imageSource: string): Promise<OCRDetection[]> {
    return await this.controller.forward(imageSource);
  }

  /**
   * Release the memory held by the module. Calling `forward` afterwards is invalid.
   * Note that you cannot delete model while it's generating.
   */
  delete() {
    this.controller.delete();
  }
}
