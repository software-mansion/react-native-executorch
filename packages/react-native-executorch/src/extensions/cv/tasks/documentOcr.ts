import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { wrapAsync } from '../../../core/runtime';
import type { ImageBuffer } from '../image';
import type { Point } from '../ops/points';
import type { BoundingBox } from '../ops/boxes';
import { boundsOfPoints } from '../ops/quad';
import { rotate, FORMAT_CHANNELS } from '../ops/image';
import { createOcr, type OcrModel, type OcrDetection } from './ocr';
import {
  createObjectDetector,
  type ObjectDetectorModel,
  type ObjectDetection,
} from './objectDetection';
import { createDocumentModels, type DocumentModelsConfig } from './ocr/documentModels';
import { orderByReadingOrder } from './ocr/ocrUtils';
import { cropImageBuffer, fillTableCells } from './ocr/documentHelpers';

/**
 * One assembled document block: a layout region (or an ungrouped catch-all) with
 * its OCR lines grouped and concatenated, in reading order.
 * @category Types
 */
export type DocumentBlock<L> = {
  /** Region class from layout (e.g. `'text'`, `'table'`), or `'ungrouped'`. */
  readonly regionType: L | 'ungrouped';
  /** Block box in processing-frame pixels. */
  readonly bbox: BoundingBox<'xyxy'>;
  /** Layout confidence for the region (1 for `'ungrouped'`). */
  readonly score: number;
  /** The block's text, lines joined top-to-bottom by newlines. */
  readonly text: string;
  /** The OCR lines inside this block, top-to-bottom. */
  readonly lines: readonly OcrDetection[];
  /** Whether this block is a table region. */
  readonly isTable: boolean;
  /** For table blocks: the recognized HTML structure with OCR text filled in. */
  readonly tableHtml?: string;
};

/**
 * The result of a document OCR run.
 * @category Types
 */
export type DocumentResult<L> = {
  readonly blocks: DocumentBlock<L>[];
  readonly regions: ObjectDetection<'xyxy', L>[];
  readonly detections: OcrDetection[];
  /**
   * The frame all `bbox`/`quad` coordinates are relative to. Equals the input
   * image unless orientation correction or dewarp was applied, in which case it
   * is the corrected image — overlay boxes on THIS, not the original input.
   */
  readonly image: ImageBuffer;
};

/**
 * Configuration for the document OCR orchestrator. Provides an OCR model, an
 * optional layout model (regions/blocks), and optional document models
 * (orientation/dewarp pre-processing + table-structure recognition). The
 * `orientation`/`dewarp` flags are *defaults* for the per-run options of the
 * same name — supply them here to bias every run, or leave them off and pass
 * them to `runDocumentOcr` per call (the document models are loaded either way).
 * @category Types
 */
export type DocumentOcrModel<L> = {
  readonly ocr: OcrModel;
  readonly layout?: ObjectDetectorModel<'xyxy', L>;
  readonly documentModels?: DocumentModelsConfig;
  /** Default for the per-run `orientation` option (needs `documentModels`). */
  readonly orientation?: boolean;
  /** Default for the per-run `dewarp` option (needs `documentModels`). */
  readonly dewarp?: boolean;
  /**
   * Minimum orientation-classifier confidence (softmax of the argmax class) to act
   * on a non-zero rotation — below it the page is treated as already upright, so
   * out-of-distribution inputs (photos/non-documents) don't spuriously flip. Genuine
   * documents score >0.95; defaults to 0.85.
   */
  readonly orientationMinConfidence?: number;
};

/**
 * Per-run document options (passed to `runDocumentOcr`, not baked into the
 * model — toggling them needs no reload). Each pre-processing pass still
 * requires the document models to have been loaded (`config.documentModels`).
 * @category Types
 */
export type RunDocumentOcrOptions = {
  /**
   * Detect + correct page orientation before OCR. No-op without loaded document
   * models. Defaults to the model's `config.orientation`.
   */
  readonly orientation?: boolean;
  /**
   * Geometrically dewarp the page before OCR. No-op without loaded document
   * models. Defaults to the model's `config.dewarp`.
   */
  readonly dewarp?: boolean;
};

// Layout classes that carry no text — skip OCR on them.
const VISUAL_LABELS = ['image', 'chart', 'seal'];

function makeBlock<L>(
  regionType: L | 'ungrouped',
  bbox: BoundingBox<'xyxy'>,
  score: number,
  lines: OcrDetection[],
  isTable: boolean
): DocumentBlock<L> {
  'worklet';
  const sorted = orderByReadingOrder(lines);
  return {
    regionType,
    bbox,
    score,
    isTable,
    lines: sorted,
    text: sorted.map((l) => l.text).join('\n'),
  };
}

/**
 * Creates the document OCR orchestrator. Pipeline: correct orientation → dewarp
 * (document models) → layout → per-region OCR (each text region is cropped and OCR'd on
 * its own, upscaled into the detector — far better recall on dense pages than one
 * whole-page pass; lines are offset back to page coords) → tables recognize their
 * structure and fill cells with that region's OCR. Visual regions are skipped.
 * Without layout it OCRs the whole page into one block. Layout/document models optional.
 * @category Typescript API
 * @param config OCR model + optional layout + optional document models + flags.
 * @param runtime Optional worklet runtime thread.
 * @returns A promise resolving to run + disposal controls.
 */
export async function createDocumentOcr<L>(
  config: DocumentOcrModel<L>,
  runtime?: WorkletRuntime
): Promise<{
  dispose: () => void;
  runDocumentOcr: (
    input: ImageBuffer,
    options?: RunDocumentOcrOptions
  ) => Promise<DocumentResult<L>>;
  runDocumentOcrWorklet: (input: ImageBuffer, options?: RunDocumentOcrOptions) => DocumentResult<L>;
}> {
  const ocr = await createOcr(config.ocr, runtime);
  let layout: Awaited<ReturnType<typeof createObjectDetector<'xyxy', L>>> | null = null;
  let documentModels: Awaited<ReturnType<typeof createDocumentModels>> | null = null;
  try {
    layout = config.layout ? await createObjectDetector<'xyxy', L>(config.layout, runtime) : null;
    documentModels = config.documentModels
      ? await createDocumentModels(config.documentModels, runtime)
      : null;
  } catch (e) {
    // A later model failing to build must not leak the ones already built.
    layout?.dispose();
    ocr.dispose();
    throw e;
  }
  const defaultOrientation = !!config.orientation;
  const defaultDewarp = !!config.dewarp;
  const minConfidence = config.orientationMinConfidence ?? 0.85;

  const dispose = () => {
    ocr.dispose();
    layout?.dispose();
    documentModels?.dispose();
  };

  const runDocumentOcrWorklet = (
    input: ImageBuffer,
    options?: RunDocumentOcrOptions
  ): DocumentResult<L> => {
    'worklet';
    const useOrientation = !!documentModels && (options?.orientation ?? defaultOrientation);
    const useDewarp = !!documentModels && (options?.dewarp ?? defaultDewarp);
    let img = input;
    if ((useOrientation || useDewarp) && documentModels) {
      const ch = FORMAT_CHANNELS[input.format];
      let page = tensor('uint8', [input.height, input.width, ch]);
      page.setData(input.data);
      let pw = input.width;
      let ph = input.height;
      try {
        if (useOrientation) {
          const orientation = documentModels.detectOrientationWorklet(page, input.format);
          const deg = ((360 - orientation.rotationCW) % 360) as 0 | 90 | 180 | 270;
          if (deg !== 0 && orientation.confidence >= minConfidence) {
            const swap = deg === 90 || deg === 270;
            const rotated = tensor('uint8', [swap ? pw : ph, swap ? ph : pw, ch]);
            try {
              rotate(page, rotated, deg);
            } catch (e) {
              rotated.dispose(); // rotate threw before we adopted `rotated` as `page`
              throw e;
            }
            page.dispose();
            page = rotated;
            if (swap) {
              [pw, ph] = [ph, pw];
            }
          }
        }
        if (useDewarp) {
          // dewarp returns the input tensor unchanged when it declines the warp.
          const dewarped = documentModels.dewarpWorklet(page, input.format);
          if (dewarped !== page) {
            page.dispose();
            page = dewarped;
          }
        }
        const out = new Uint8Array(pw * ph * ch);
        page.getData(out);
        img = { data: out, width: pw, height: ph, format: input.format, layout: input.layout };
      } finally {
        page.dispose();
      }
    }

    try {
      if (!layout) {
        const detections = ocr.runOcrWorklet(img, { release: false }).detections;
        const blocks = detections.length
          ? [
              makeBlock<L>(
                'ungrouped',
                { format: 'xyxy', ...boundsOfPoints(detections.flatMap((d) => d.quad as Point[])) },
                1,
                detections,
                false
              ),
            ]
          : [];
        return { blocks, regions: [], detections, image: img };
      }

      const regions = layout.detectObjectsWorklet(img);
      const blocks: DocumentBlock<L>[] = [];
      const detections: OcrDetection[] = [];
      for (const region of regions) {
        if (VISUAL_LABELS.includes(String(region.label))) {
          continue;
        }
        const { xmin, ymin } = region.box;
        const crop = cropImageBuffer(img, region.box);
        const lines = ocr.runOcrWorklet(crop, { release: false }).detections.map((d) => ({
          ...d,
          quad: d.quad.map((p) => ({ x: p.x + xmin, y: p.y + ymin })),
        }));
        if (lines.length === 0 && region.label !== 'table') {
          continue;
        }
        detections.push(...lines);
        let block = makeBlock<L>(
          region.label,
          region.box,
          region.confidence,
          lines,
          region.label === 'table'
        );
        if (region.label === 'table' && documentModels) {
          const structure = documentModels.recognizeTableWorklet(crop);
          block = { ...block, tableHtml: fillTableCells(structure.html, block.lines) };
        }
        blocks.push(block);
      }
      blocks.sort((a, b) => a.bbox.ymin - b.bbox.ymin || a.bbox.xmin - b.bbox.xmin);
      return { blocks, regions, detections, image: img };
    } finally {
      // Per-region runs pass release: false; the bucket arenas are freed once per page.
      ocr.releaseMethodsWorklet();
    }
  };

  const runDocumentOcr = wrapAsync(runDocumentOcrWorklet, runtime);
  return { runDocumentOcr, runDocumentOcrWorklet, dispose };
}
