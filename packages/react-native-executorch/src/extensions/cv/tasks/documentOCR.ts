import type { WorkletRuntime } from 'react-native-worklets';

import { wrapAsync } from '../../../core/runtime';
import type { ImageBuffer } from '../image';
import type { Point } from '../ops/points';
import { boundingBoxOf, type BoundingBox } from '../ops/boxes';
import { createOCR, type OCRModel, type OCRDetection } from './ocr';
import {
  createObjectDetector,
  type ObjectDetectorModel,
  type ObjectDetection,
} from './objectDetection';
import { createSupporting, type SupportingModel } from './supporting';
import { cropImageBuffer, rotateImageBuffer, fillTableCells } from './documentHelpers';

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
  readonly lines: readonly OCRDetection[];
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
  readonly detections: OCRDetection[];
  /**
   * The frame all `bbox`/`quad` coordinates are relative to. Equals the input
   * image unless orientation correction or dewarp was applied, in which case it
   * is the corrected image — overlay boxes on THIS, not the original input.
   */
  readonly image: ImageBuffer;
};

/**
 * Configuration for the document OCR orchestrator. Provides an OCR model, an
 * optional layout model (regions/blocks), and an optional supporting model
 * (orientation/dewarp pre-processing + table-structure recognition). The
 * `orientation`/`dewarp` flags are *defaults* for the per-run options of the
 * same name — supply them here to bias every run, or leave them off and pass
 * them to `runDocumentOCR` per call (the supporting model is loaded either way).
 * @category Types
 */
export type DocumentOCRModel<L> = {
  readonly ocr: OCRModel;
  readonly layout?: ObjectDetectorModel<'xyxy', L>;
  readonly supporting?: SupportingModel;
  /** Default for the per-run `orientation` option (needs `supporting`). */
  readonly orientation?: boolean;
  /** Default for the per-run `dewarp` option (needs `supporting`). */
  readonly dewarp?: boolean;
};

/**
 * Per-run document options (passed to `runDocumentOCR`, not baked into the
 * model — toggling them needs no reload). Each pre-processing pass still
 * requires the supporting model to have been loaded (`config.supporting`).
 * @category Types
 */
export type RunDocumentOCROptions = {
  /**
   * Detect + correct page orientation before OCR. No-op without a loaded
   * supporting model. Defaults to the model's `config.orientation`.
   */
  readonly orientation?: boolean;
  /**
   * Geometrically dewarp the page before OCR. No-op without a loaded supporting
   * model. Defaults to the model's `config.dewarp`.
   */
  readonly dewarp?: boolean;
};

const centerOf = (quad: readonly Point[]): { x: number; y: number } => {
  'worklet';
  const b = boundingBoxOf(quad);
  return { x: (b.xmin + b.xmax) / 2, y: (b.ymin + b.ymax) / 2 };
};

const isTableLabel = (label: unknown): boolean => {
  'worklet';
  return String(label) === 'table';
};

// Layout classes that carry no text — skip OCR on them.
const VISUAL_LABELS = ['image', 'chart', 'seal'];
const isTextRegion = (label: unknown): boolean => {
  'worklet';
  return !VISUAL_LABELS.includes(String(label));
};

// Shifts a crop-space detection back into page coordinates.
function offsetDetection(d: OCRDetection, dx: number, dy: number): OCRDetection {
  'worklet';
  return { ...d, quad: d.quad.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
}

function makeBlock<L>(
  regionType: L | 'ungrouped',
  bbox: BoundingBox<'xyxy'>,
  score: number,
  lines: OCRDetection[],
  isTable: boolean
): DocumentBlock<L> {
  'worklet';
  // Decorate with each line's y-center once, then sort top-to-bottom (avoids
  // recomputing the bbox inside the O(n log n) comparator).
  const sorted = lines
    .map((line) => ({ line, cy: centerOf(line.quad).y }))
    .sort((a, b) => a.cy - b.cy)
    .map((e) => e.line);
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
 * (supporting) → layout → per-region OCR (each text region is cropped and OCR'd on
 * its own, upscaled into the detector — far better recall on dense pages than one
 * whole-page pass; lines are offset back to page coords) → tables recognize their
 * structure and fill cells with that region's OCR. Visual regions are skipped.
 * Without layout it OCRs the whole page into one block. Layout/supporting optional.
 * @category Typescript API
 * @param config OCR model + optional layout + optional supporting + flags.
 * @param runtime Optional worklet runtime thread.
 * @returns A promise resolving to run + disposal controls.
 */
export async function createDocumentOCR<L>(
  config: DocumentOCRModel<L>,
  runtime?: WorkletRuntime
): Promise<{
  dispose: () => void;
  runDocumentOCR: (
    input: ImageBuffer,
    options?: RunDocumentOCROptions
  ) => Promise<DocumentResult<L>>;
  runDocumentOCRWorklet: (input: ImageBuffer, options?: RunDocumentOCROptions) => DocumentResult<L>;
}> {
  const ocr = await createOCR(config.ocr, runtime);
  const layout = config.layout
    ? await createObjectDetector<'xyxy', L>(config.layout, runtime)
    : null;
  const supporting = config.supporting ? await createSupporting(config.supporting, runtime) : null;
  // Per-run orientation/dewarp default to the model's config flags; both are
  // no-ops without a loaded supporting model.
  const defaultOrientation = !!config.orientation;
  const defaultDewarp = !!config.dewarp;

  const dispose = () => {
    ocr.dispose();
    layout?.dispose();
    supporting?.dispose();
  };

  const runDocumentOCRWorklet = (
    input: ImageBuffer,
    options?: RunDocumentOCROptions
  ): DocumentResult<L> => {
    'worklet';
    const useOrientation = !!supporting && (options?.orientation ?? defaultOrientation);
    const useDewarp = !!supporting && (options?.dewarp ?? defaultDewarp);
    let img = input;
    if (useOrientation && supporting) {
      const rot = supporting.detectOrientationWorklet(img).rotationCW;
      if (rot !== 0) {
        img = rotateImageBuffer(img, ((360 - rot) % 360) as 0 | 90 | 180 | 270);
      }
    }
    if (useDewarp && supporting) {
      img = supporting.dewarpWorklet(img);
    }

    // OCR runs once per region here (potentially many), so don't let each call
    // free+reload its bucket arenas (release: false). Instead free the model's
    // bucket methods ONCE in the finally below, after the whole page — keeping
    // the page's working set cached while still bounding memory across pages.
    try {
      // Mode A — no layout: OCR the whole page into one block.
      if (!layout) {
        const detections = ocr.runOCRWorklet(img, { release: false }).detections;
        const blocks = detections.length
          ? [
              makeBlock<L>(
                'ungrouped',
                boundingBoxOf(detections.flatMap((d) => d.quad as Point[])),
                1,
                detections,
                false
              ),
            ]
          : [];
        return { blocks, regions: [], detections, image: img };
      }

      // Mode B — layout: OCR each text region's crop on its own (upscaled into the
      // detector → far better recall than one whole-page pass), offsetting lines
      // back to page coords. Tables also recognize structure + fill cells.
      const regions = layout.detectObjectsWorklet(img);
      const blocks: DocumentBlock<L>[] = [];
      const detections: OCRDetection[] = [];
      for (const region of regions) {
        if (!isTextRegion(region.label)) {
          continue;
        }
        const { xmin, ymin } = region.box;
        const crop = cropImageBuffer(img, region.box);
        const lines = ocr
          .runOCRWorklet(crop, { release: false })
          .detections.map((d) => offsetDetection(d, xmin, ymin));
        const table = isTableLabel(region.label);
        if (lines.length === 0 && !table) {
          continue;
        }
        detections.push(...lines);
        let block = makeBlock<L>(region.label, region.box, region.confidence, lines, table);
        if (table && supporting) {
          const structure = supporting.recognizeTableWorklet(crop);
          block = { ...block, tableHtml: fillTableCells(structure.html, block.lines) };
        }
        blocks.push(block);
      }
      blocks.sort((a, b) => a.bbox.ymin - b.bbox.ymin || a.bbox.xmin - b.bbox.xmin);
      return { blocks, regions, detections, image: img };
    } finally {
      // Free the OCR model's bucket arenas once, after the whole page (the
      // per-region runs used release: false). Bounds memory across pages while
      // keeping each page's working set cached during the run.
      ocr.releaseMethodsWorklet();
    }
  };

  const runDocumentOCR = wrapAsync(runDocumentOCRWorklet, runtime);
  return { runDocumentOCR, runDocumentOCRWorklet, dispose };
}
