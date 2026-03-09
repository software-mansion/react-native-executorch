import { OCRModule } from '../../modules/computer_vision/OCRModule';
import { OCRProps, OCRType } from '../../types/ocr';
import { useModuleFactory } from '../useModuleFactory';

/**
 * React hook for managing an OCR instance.
 *
 * @category Hooks
 * @param OCRProps - Configuration object containing `model` sources and optional `preventLoad` flag.
 * @returns Ready to use OCR model.
 */
export const useOCR = ({ model, preventLoad = false }: OCRProps): OCRType => {
  const { error, isReady, isGenerating, downloadProgress, runForward } =
    useModuleFactory({
      factory: (config, onProgress) =>
        OCRModule.fromModelName(config, onProgress),
      config: model,
      deps: [
        model.modelName,
        model.detectorSource,
        model.recognizerSource,
        model.language,
      ],
      preventLoad,
    });

  const forward = (imageSource: string) =>
    runForward((inst) => inst.forward(imageSource));

  return { error, isReady, isGenerating, downloadProgress, forward };
};
