import { createOcr, type OcrModel } from '../extensions/cv/tasks/ocr/ocr';
import { useResourceDownload } from './useResourceDownload';
import { useModel } from './useModel';

// Swap a model spec's hosted `modelPath` for its downloaded local path. Returns
// undefined when the spec is absent (an optional model) or its path hasn't
// finished downloading yet.
const localize = <M extends { modelPath: string }>(
  spec: M | undefined,
  localPath: string | undefined
): M | undefined => (spec && localPath ? { ...spec, modelPath: localPath } : undefined);

/**
 * React hook for the OCR pipeline (EasyOCR / PaddleOCR), optionally composed with
 * layout detection and document-helper models (orientation/dewarp/table). It
 * downloads/compiles every enabled model, tracks combined progress and errors,
 * instantiates the task runner, and cleans up native memory on unmount or config
 * change. Heavy work runs on a worklet thread; `runOcr` resolves with the
 * recognized regions, layout blocks, and corrected frame.
 * @category Hooks
 * @typeParam L The layout region class-label type (from the `layout` model).
 * @param config OCR model + optional layout / document models. Use a preset from
 * `models.ocr.*` (plus `models.layoutDetection.*` / `models.documentModels.*`).
 * @param options Optional flags. `preventLoad` defers downloading/compiling the
 * models until set to `false`.
 * @returns Readiness flags, combined download progress, and the `runOcr` /
 * `runOcrWorklet` runners.
 */
export function useOcr<L = never>(config: OcrModel<L>, options?: { preventLoad?: boolean }) {
  const ocrDl = useResourceDownload(config.modelPath, options?.preventLoad);
  const layoutDl = useResourceDownload(config.layout?.modelPath, options?.preventLoad);
  const documentModelsDl = useResourceDownload(
    config.documentModels?.modelPath,
    options?.preventLoad
  );

  const layout = localize(config.layout, layoutDl.localPath);
  const documentModels = localize(config.documentModels, documentModelsDl.localPath);
  const ready =
    !!ocrDl.localPath &&
    (!config.layout || !!layout) &&
    (!config.documentModels || !!documentModels);
  const localConfig: OcrModel<L> | null = ready
    ? { ...config, modelPath: ocrDl.localPath!, layout, documentModels }
    : null;

  const { model, error } = useModel(createOcr<L>, localConfig, [
    ocrDl.localPath,
    layoutDl.localPath,
    documentModelsDl.localPath,
  ]);

  const downloads = [
    ocrDl,
    ...(config.layout ? [layoutDl] : []),
    ...(config.documentModels ? [documentModelsDl] : []),
  ];

  return {
    isReady: !!model,
    error: downloads.map((d) => d.downloadError).find(Boolean) || error,
    downloadProgress: Math.min(...downloads.map((d) => d.downloadProgress)),
    runOcr: model?.runOcr,
    runOcrWorklet: model?.runOcrWorklet,
  };
}
