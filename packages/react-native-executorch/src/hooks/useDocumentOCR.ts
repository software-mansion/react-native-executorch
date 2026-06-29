import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import { createDocumentOCR, type DocumentOCRModel } from '../extensions/cv/tasks/documentOCR';

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

  const ready =
    !!ocrDl.localPath &&
    (!config.layout || !!layoutDl.localPath) &&
    (!config.supporting || !!supDl.localPath);
  const localConfig: DocumentOCRModel<L> | null = ready
    ? {
        ...config,
        ocr: { ...config.ocr, modelPath: ocrDl.localPath! },
        ...(config.layout ? { layout: { ...config.layout, modelPath: layoutDl.localPath! } } : {}),
        ...(config.supporting
          ? { supporting: { ...config.supporting, modelPath: supDl.localPath! } }
          : {}),
      }
    : null;

  const { model, error } = useModel(createDocumentOCR<L>, localConfig, [
    ocrDl.localPath,
    layoutDl.localPath,
    supDl.localPath,
  ]);

  // Overall progress is the slowest of the enabled downloads, so it can't read
  // 100% while a second/third model is still fetching.
  const progresses = [ocrDl.downloadProgress];
  if (config.layout) progresses.push(layoutDl.downloadProgress);
  if (config.supporting) progresses.push(supDl.downloadProgress);

  return {
    isReady: !!model,
    error: ocrDl.downloadError || layoutDl.downloadError || supDl.downloadError || error,
    downloadProgress: Math.min(...progresses),
    runDocumentOCR: model?.runDocumentOCR,
    runDocumentOCRWorklet: model?.runDocumentOCRWorklet,
  };
}
