import { Logger } from '../../common/Logger';
import { VerticalOCRController } from '../../controllers/VerticalOCRController';
import { parseUnknownError } from '../../errors/errorUtils';
import { ResourceSource } from '../../types/common';
import { OCRDetection, OCRLanguage, OCRModelName } from '../../types/ocr';

/**
 * Module for Vertical Optical Character Recognition (Vertical OCR) tasks.
 *
 * @category Typescript API
 */
export class VerticalOCRModule {
  private controller: VerticalOCRController;

  private constructor() {
    this.controller = new VerticalOCRController();
  }

  /**
   * Creates a Vertical OCR instance for a built-in model.
   *
   * @param namedSources - An object specifying the model name, detector source, recognizer source, language, and optional independent characters flag.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `VerticalOCRModule` instance.
   *
   * @example
   * ```ts
   * import { VerticalOCRModule, OCR_JAPANESE } from 'react-native-executorch';
   * const ocr = await VerticalOCRModule.fromModelName({ ...OCR_JAPANESE, independentCharacters: true });
   * ```
   */
  static async fromModelName(
    namedSources: {
      modelName: OCRModelName;
      detectorSource: ResourceSource;
      recognizerSource: ResourceSource;
      language: OCRLanguage;
      independentCharacters?: boolean;
    },
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<VerticalOCRModule> {
    const instance = new VerticalOCRModule();
    try {
      await instance.controller.load(
        namedSources.detectorSource,
        namedSources.recognizerSource,
        namedSources.language,
        namedSources.independentCharacters ?? false,
        onDownloadProgress
      );
      return instance;
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Creates a Vertical OCR instance with a user-provided model binary.
   * Use this when working with a custom-exported Vertical OCR model.
   * Internally uses `'custom'` as the model name for telemetry.
   *
   * @remarks The native model contract for this method is not formally defined and may change
   * between releases. Refer to the native source code for the current expected tensor interface.
   *
   * @param detectorSource - A fetchable resource pointing to the text detector model binary.
   * @param recognizerSource - A fetchable resource pointing to the text recognizer model binary.
   * @param language - The language for the OCR model.
   * @param independentCharacters - Whether to treat characters independently during recognition.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `VerticalOCRModule` instance.
   */
  static fromCustomModel(
    detectorSource: ResourceSource,
    recognizerSource: ResourceSource,
    language: OCRLanguage,
    independentCharacters: boolean = false,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<VerticalOCRModule> {
    return VerticalOCRModule.fromModelName(
      {
        modelName: `ocr-${language}` as OCRModelName,
        detectorSource,
        recognizerSource,
        language,
        independentCharacters,
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
