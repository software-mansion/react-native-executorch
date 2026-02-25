import { useEffect, useState } from 'react';
import { OCRProps, OCRType, OCRDetection } from '../../types/ocr';
import { Frame } from '../../types/common';
import { OCRController } from '../../controllers/OCRController';
import { RnExecutorchError } from '../../errors/errorUtils';

/**
 * React hook for managing an OCR instance.
 *
 * @category Hooks
 * @param OCRProps - Configuration object containing `model` sources and optional `preventLoad` flag.
 * @returns Ready to use OCR model.
 */
export const useOCR = ({ model, preventLoad = false }: OCRProps): OCRType => {
  const [error, setError] = useState<RnExecutorchError | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [runOnFrame, setRunOnFrame] = useState<
    ((frame: Frame) => OCRDetection[]) | null
  >(null);

  const [controllerInstance] = useState(
    () =>
      new OCRController({
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
