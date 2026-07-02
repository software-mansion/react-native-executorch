import { createOcr, type OcrModel } from '../extensions/cv/tasks/ocr/ocr';
import { useResourceDownload } from './useResourceDownload';
import { useModel } from './useModel';

/**
 * React hook for running the unified OCR pipeline (EasyOCR / PaddleOCR).
 *
 * Downloads the fused PTE, instantiates the OCR task runner, and manages its
 * lifetime. Heavy work runs on a worklet thread; the returned `runOcr` resolves
 * with the recognized text regions.
 * @category Hooks
 * @param config OCR model configuration (one fused PTE + flat options). Use a
 * preset from `models.ocr.*`.
 * @param options Optional flags. `preventLoad` defers downloading/compiling the
 * model until set to `false`.
 * @returns Readiness flags, download progress, and the `runOcr` /
 * `runOcrWorklet` runners.
 */
export function useOcr(config: OcrModel, options?: { preventLoad?: boolean }) {
  const { localPath, downloadProgress, downloadError } = useResourceDownload(
    config.modelPath,
    options?.preventLoad
  );

  const { model, error } = useModel(
    createOcr,
    localPath ? { ...config, modelPath: localPath } : null,
    [localPath]
  );

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    localPath,
    runOcr: model?.runOcr,
    runOcrWorklet: model?.runOcrWorklet,
  };
}
