import { useCallback, useEffect, useState } from 'react';
import { VerticalOCRController } from '../../controllers/VerticalOCRController';
import { RnExecutorchError } from '../../errors/errorUtils';
import { OCRDetection, OCRType, VerticalOCRProps } from '../../types/ocr';

/**
 * React hook for managing a Vertical OCR instance.
 *
 * @category Hooks
 * @param VerticalOCRProps - Configuration object containing `model` sources, optional `independentCharacters` and `preventLoad` flag.
 * @returns Ready to use Vertical OCR model.
 */
export const useVerticalOCR = ({
  model,
  independentCharacters = false,
  preventLoad = false,
}: VerticalOCRProps): OCRType => {
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<RnExecutorchError | null>(null);

  const [controller] = useState(
    () =>
      new VerticalOCRController({
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
      independentCharacters,
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
    independentCharacters,
    preventLoad,
  ]);

  const forward = useCallback(
    (imageSource: string): Promise<OCRDetection[]> =>
      controller.forward(imageSource),
    [controller]
  );

  return { error, isReady, isGenerating, downloadProgress, forward };
};
