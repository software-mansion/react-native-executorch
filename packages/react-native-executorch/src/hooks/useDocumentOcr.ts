import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import { createDocumentOcr, type DocumentOcrModel } from '../extensions/cv/tasks/documentOcr';

// Swap a model spec's hosted `modelPath` for its downloaded local path. Returns
// undefined when the spec is absent (an optional model) or its path hasn't
// finished downloading yet.
const localize = <M extends { modelPath: string }>(
  spec: M | undefined,
  localPath: string | undefined
): M | undefined => (spec && localPath ? { ...spec, modelPath: localPath } : undefined);

/**
 * React hook for the document OCR pipeline: OCR + optional layout detection +
 * optional document models (orientation/dewarp/table), assembled into reading-ordered
 * blocks. Downloads/compiles all enabled models, tracks progress and errors, and
 * cleans up native memory on unmount or config change.
 * @category Hooks
 * @typeParam L The type representing the layout region class labels.
 * @param config OCR model + optional layout/document models + flags.
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the models.
 * @returns Loading state, error, download progress, and the document run functions.
 */
export function useDocumentOcr<L>(
  config: DocumentOcrModel<L>,
  options?: { preventLoad?: boolean }
) {
  const ocrDl = useResourceDownload(config.ocr.modelPath, options?.preventLoad);
  const layoutDl = useResourceDownload(config.layout?.modelPath, options?.preventLoad);
  const documentModelsDl = useResourceDownload(
    config.documentModels?.modelPath,
    options?.preventLoad
  );

  const ocr = localize(config.ocr, ocrDl.localPath);
  const layout = localize(config.layout, layoutDl.localPath);
  const documentModels = localize(config.documentModels, documentModelsDl.localPath);
  const ready =
    !!ocr && (!config.layout || !!layout) && (!config.documentModels || !!documentModels);
  const localConfig: DocumentOcrModel<L> | null = ready
    ? { ...config, ocr: ocr!, layout, documentModels }
    : null;

  const { model, error } = useModel(createDocumentOcr<L>, localConfig, [
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
    runDocumentOcr: model?.runDocumentOcr,
    runDocumentOcrWorklet: model?.runDocumentOcrWorklet,
  };
}
