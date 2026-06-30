import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import { createDocumentOCR, type DocumentOCRModel } from '../extensions/cv/tasks/documentOCR';

// Swap a model spec's hosted `modelPath` for its downloaded local path. Returns
// undefined when the spec is absent (an optional model) or its path hasn't
// finished downloading yet.
const localize = <M extends { modelPath: string }>(
  spec: M | undefined,
  localPath: string | undefined
): M | undefined => (spec && localPath ? { ...spec, modelPath: localPath } : undefined);

/**
 * React hook for the document OCR pipeline: OCR + optional layout detection +
 * optional supporting (orientation/dewarp/table), assembled into reading-ordered
 * blocks. Downloads/compiles all enabled models, tracks progress and errors, and
 * cleans up native memory on unmount or config change.
 * @category Hooks
 * @typeParam L The type representing the layout region class labels.
 * @param config OCR model + optional layout/supporting models + flags.
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the models.
 * @returns Loading state, error, download progress, and the document run functions.
 */
export function useDocumentOCR<L>(
  config: DocumentOCRModel<L>,
  options?: { preventLoad?: boolean }
) {
  const ocrDl = useResourceDownload(config.ocr.modelPath, options?.preventLoad);
  const layoutDl = useResourceDownload(config.layout?.modelPath, options?.preventLoad);
  const supDl = useResourceDownload(config.supporting?.modelPath, options?.preventLoad);

  // Localize each enabled model; an optional model is "ready" when it's either
  // absent or fully downloaded. Build the run config only once all are ready.
  const ocr = localize(config.ocr, ocrDl.localPath);
  const layout = localize(config.layout, layoutDl.localPath);
  const supporting = localize(config.supporting, supDl.localPath);
  const ready = !!ocr && (!config.layout || !!layout) && (!config.supporting || !!supporting);
  const localConfig: DocumentOCRModel<L> | null = ready
    ? { ...config, ocr: ocr!, layout, supporting }
    : null;

  const { model, error } = useModel(createDocumentOCR<L>, localConfig, [
    ocrDl.localPath,
    layoutDl.localPath,
    supDl.localPath,
  ]);

  // Aggregate only the ENABLED downloads, so progress can't read 100% while a
  // second/third model is still fetching.
  const downloads = [
    ocrDl,
    ...(config.layout ? [layoutDl] : []),
    ...(config.supporting ? [supDl] : []),
  ];

  return {
    isReady: !!model,
    error: downloads.map((d) => d.downloadError).find(Boolean) || error,
    downloadProgress: Math.min(...downloads.map((d) => d.downloadProgress)),
    runDocumentOCR: model?.runDocumentOCR,
    runDocumentOCRWorklet: model?.runDocumentOCRWorklet,
  };
}
