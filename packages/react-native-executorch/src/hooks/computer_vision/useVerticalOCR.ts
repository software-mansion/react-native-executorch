import { useEffect, useState } from 'react';
import { OCRType, VerticalOCRProps, OCRDetection } from '../../types/ocr';
import { Frame } from '../../types/common';
import { VerticalOCRController } from '../../controllers/VerticalOCRController';
import { RnExecutorchError } from '../../errors/errorUtils';

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
  const [error, setError] = useState<RnExecutorchError | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [runOnFrame, setRunOnFrame] = useState<
    ((frame: Frame) => OCRDetection[]) | null
  >(null);

  const [controllerInstance] = useState(
    () =>
      new VerticalOCRController({
        isReadyCallback: setIsReady,
        isGeneratingCallback: setIsGenerating,
        errorCallback: setError,
      })
  );

  useEffect(() => {
    if (preventLoad) return;

    (async () => {
      await controllerInstance.load(
        model.detectorSource,
        model.recognizerSource,
        model.language,
        independentCharacters,
        setDownloadProgress
      );

      const worklet = controllerInstance.runOnFrame;
      if (worklet) {
        setRunOnFrame(() => worklet);
      }
    })();

    return () => {
      setRunOnFrame(null);
      setIsReady(false);
      controllerInstance.delete();
    };
  }, [
    controllerInstance,
    model.detectorSource,
    model.recognizerSource,
    model.language,
    independentCharacters,
    preventLoad,
  ]);

  return {
    error,
    isReady,
    isGenerating,
    forward: controllerInstance.forward,
    downloadProgress,
    runOnFrame,
  };
};
