import { createOcr, type OcrModel } from '../extensions/cv/tasks/ocr/ocr';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import { useModel } from './useModel';

/**
 * React hook for the OCR pipeline (PaddleOCR). It downloads and loads
 * the model, tracks progress and errors, instantiates the task runner, and cleans
 * up native memory on unmount or config change. Heavy work runs on a worklet
 * thread; `runOcr` resolves with the recognized regions in reading order.
 * @category Hooks
 * @param config OCR model configuration. Use a preset from `models.ocr.*`.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns Readiness flags, download progress, and the `runOcr` /
 * `runOcrWorklet` runners.
 */
export function useOcr(config: OcrModel, options?: ResourceOptions) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createOcr, resource ?? null);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    runOcr: model?.runOcr,
    runOcrWorklet: model?.runOcrWorklet,
  };
}
