import { createOcr, type OcrModel } from '../extensions/cv/tasks/ocr/ocr';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import { useModel } from './useModel';

/**
 * React hook for the OCR pipeline (EasyOCR / PaddleOCR), optionally composed with
 * layout detection and document-helper models (orientation/dewarp/table). It
 * downloads and loads every enabled model, tracks combined progress and errors,
 * instantiates the task runner, and cleans up native memory on unmount or config
 * change. Heavy work runs on a worklet thread; `runOcr` resolves with the
 * recognized regions, layout blocks, and corrected frame.
 * @category Hooks
 * @typeParam L The layout region class-label type (from the `layout` model).
 * @param config OCR model + optional layout / document models. Use a preset from
 * `models.ocr.*` (plus `models.layoutDetection.*` / `models.documentModels.*`).
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns Readiness flags, combined download progress, and the `runOcr` /
 * `runOcrWorklet` runners.
 */
export function useOcr<L = never>(config: OcrModel<L>, options?: ResourceOptions) {
  // Resolves the OCR model and the optional nested layout / document models in
  // one pass, with progress weighted across all of them.
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createOcr<L>, resource ?? null);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    runOcr: model?.runOcr,
    runOcrWorklet: model?.runOcrWorklet,
  };
}
