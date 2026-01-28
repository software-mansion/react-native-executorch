import { VerticalOCRController } from '../../controllers/VerticalOCRController';
import { ResourceSource } from '../../types/common';
import { OCRLanguage } from '../../types/ocr';

/**
 * Module for Vertical Optical Character Recognition (Vertical OCR) tasks.
 * 
 * @category Typescript API
 */
export class VerticalOCRModule {
  private controller: VerticalOCRController;

  constructor() {
    this.controller = new VerticalOCRController();
  }

  /**
   * Loads the model, where `detectorSource` is a string that specifies the location of the detector binary,
   * `recognizerSource` is a string that specifies the location of the recognizer binary, 
   * and `language` is a parameter that specifies the language of the text to be recognized by the OCR.
   * 
   * @param model - Object containing `detectorSource`, `recognizerSource`, and `language`.
   * @param independentCharacters - Whether to treat characters independently during recognition.
   * @param onDownloadProgressCallback - Optional callback to monitor download progress.
   */
  async load(
    model: {
      detectorSource: ResourceSource;
      recognizerSource: ResourceSource;
      language: OCRLanguage;
    },
    independentCharacters: boolean,
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ) {
    await this.controller.load(
      model.detectorSource,
      model.recognizerSource,
      model.language,
      independentCharacters,
      onDownloadProgressCallback
    );
  }

  /**
   * Executes the model's forward pass, where `imageSource` can be a fetchable resource or a Base64-encoded string.
   * 
   * @param imageSource - The image source to be processed.
   * @returns The OCR result as a string.
   */
  async forward(imageSource: string) {
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
