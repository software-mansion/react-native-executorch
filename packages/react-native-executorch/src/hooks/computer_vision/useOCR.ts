import { useCallback, useEffect, useState } from 'react';
import { OCRController } from '../../controllers/OCRController';
import { RnExecutorchError } from '../../errors/errorUtils';
import { OCRDetection, OCRProps, OCRType } from '../../types/ocr';

/**
 * React hook for managing an OCR instance.
 *
 * @category Hooks
 * @param OCRProps - Configuration object containing `model` sources and optional `preventLoad` flag.
 * @returns Ready to use OCR model.
 */
export const useOCR = ({ model, preventLoad = false }: OCRProps): OCRType => {
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<RnExecutorchError | null>(null);

  const [controller] = useState(
    () =>
      new OCRController({
        isReadyCallback: setIsReady,
        isGeneratingCallback: setIsGenerating,
        errorCallback: setError,
      })
  );

  useEffect(() => {
    setDownloadProgress(0);
    setError(null);

    if (preventLoad) return;

    controller.load(
      model.detectorSource,
      model.recognizerSource,
      model.language,
      setDownloadProgress
    );

    return () => {
      if (controller.isReady) {
        controller.delete();
      }
    };
  }, [
    controller,
    model.modelName,
    model.detectorSource,
    model.recognizerSource,
    model.language,
    preventLoad,
  ]);

  const forward = useCallback(
    (imageSource: string): Promise<OCRDetection[]> =>
      controller.forward(imageSource),
    [controller]
  );

  return { error, isReady, isGenerating, downloadProgress, forward };
};
