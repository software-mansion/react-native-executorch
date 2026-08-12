import type { WorkletRuntime } from 'react-native-worklets';

import { tensor, type Tensor } from '../../../../core/tensor';
import { loadModel } from '../../../../core/model';
import { wrapAsync } from '../../../../core/runtime';
import { IMAGENET_NORM } from '../../../../constants';

import type { ImageBuffer } from '../../image';
import { rotate, crop, FORMAT_CHANNELS, type NormalizeOptions } from '../../ops/image';
import { boundsOfPoints, quadFromBounds } from '../../ops/quad';
import type { BoundingBox } from '../../ops/boxes';
import type { TextBoxExtractor } from './detectors';
import {
  runOcrPass,
  runOcrPassOnTensor,
  resolveOcrContract,
  type OcrEngine,
  type OcrDetection,
} from './engine';
import { orderByReadingOrder } from './geometry';
import {
  createObjectDetector,
  type ObjectDetectorModel,
  type ObjectDetection,
} from '../objectDetection';
import { createDocumentModels, fillTableCells, type DocumentModelsConfig } from './documentModels';

export type { OcrDetection } from './engine';

/**
 * Model-specific OCR options. The pipeline validates the detect/recognize
 * contract and resolves legal input sizes from the model metadata itself; these
 * cover everything it can't infer.
 * @category Types
 */
export type OcrModelOptions = {
  /** Recognizer charset (string = one codepoint per index; array = taken verbatim). */
  readonly charset: string | readonly string[];
  /** Maps raw `detect` outputs to quads: {@link craftExtractBoxes} / {@link dbnetExtractBoxes}. */
  readonly extractBoxes: TextBoxExtractor;
  /**
   * Drop detections below this recognition confidence. Default 0. Confidence is
   * the mean per-timestep max probability, so this requires the recognizer to
   * export a softmaxed head (values in `[0,1]`); on raw logits it is meaningless.
   */
  readonly minConfidence?: number;
  /** Detector norm on uint8 RGB. Default ImageNet; must match the model's training norm. */
  readonly detectorNorm?: NormalizeOptions;
  /** Recognizer norm applied after the warp. Default `(x/255−0.5)/0.5` → `[−1,1]`. */
  readonly recognizerNorm?: NormalizeOptions;
  /** Recognizer canvas padding fill. Default 128 (neutral gray). */
  readonly recognizerPadValue?: number;
  /** Strip padding fill: `'constant'` (default) or `'cornerMean'` (background-matched). */
  readonly recognizerPadMode?: 'constant' | 'cornerMean';
  /**
   * Custom decode replacing greedy CTC; receives softmaxed `[1,T,V]` probs. Must
   * be a worklet. The probs tensor is pre-allocated from the recognizer's fixed
   * width-to-timesteps ratio, so `T` always matches the run's input width.
   */
  readonly decode?: (
    probs: Tensor,
    charset: readonly string[]
  ) => { readonly text: string; readonly confidence: number };
};

/**
 * Model configuration for the OCR pipeline: one fused detect/recognize PTE plus
 * its options, with optional `layout` (group text into regions) and
 * `documentModels` (orientation/dewarp/table) stages. Omit both for whole-page OCR.
 * @category Types
 * @typeParam L The layout region class-label type.
 */
export type OcrModel<L = never> = {
  readonly modelPath: string;
  readonly modelOpts: OcrModelOptions;
  readonly layout?: ObjectDetectorModel<'xyxy', L>;
  readonly documentModels?: DocumentModelsConfig;
  /** Layout labels carrying no text — OCR skips these regions. Default `['image', 'chart', 'seal']`. */
  readonly visualLabels?: readonly string[];
  /** The layout label treated as a table (structure recognition + cell fill). Default `'table'`. */
  readonly tableLabel?: string;
};

/**
 * Per-run OCR options — toggled without reloading. `orientation`/`dewarp` are
 * no-ops without loaded `documentModels` and default to its config flags.
 * @category Types
 */
export type RunOcrOptions = {
  /**
   * Also read upright glyph stacks (vertical text) — extra compute. Fully
   * supported with CRAFT; partial with DBNet (glyph columns are still read, but
   * the stacked-box char-level re-detection split is skipped).
   */
  readonly vertical?: boolean;
  /** Height/width ratio above which a box is a vertical stack. Default 1.5. */
  readonly tallCropRatio?: number;
  /** Max stacked-box re-detection passes per page. Default 8. */
  readonly maxRedetections?: number;
  /** Drop vertical reads below this confidence. Default 0.4; set 0 to keep all. */
  readonly verticalMinConfidence?: number;
  /** Rotate the page upright first. No-op without loaded `documentModels`; defaults to its config flag. */
  readonly orientation?: boolean;
  /** Flatten a physically-warped page first. No-op without loaded `documentModels`; defaults to its config flag. */
  readonly dewarp?: boolean;
  /** Recognize table structure in table regions. Needs loaded `documentModels` (with a table config) + layout. Default true. */
  readonly tables?: boolean;
};

/**
 * One assembled document block: a layout region (or an ungrouped catch-all) with
 * its OCR lines in reading order and their texts joined by newlines. All
 * coordinates are in the {@link OcrResult} `image` frame.
 * @category Types
 */
export type DocumentBlock<L> = {
  readonly regionType: L | 'ungrouped';
  readonly bbox: BoundingBox<'xyxy'>;
  /** The layout model's confidence for the region (1 for `'ungrouped'`). */
  readonly layoutConfidence: number;
  readonly text: string;
  readonly lines: readonly OcrDetection[];
  readonly isTable: boolean;
  /** The recognized table structure HTML with OCR text filled into its cells. */
  readonly tableHtml?: string;
};

/**
 * The result of one OCR run. `detections` is always the flat list of recognized
 * regions; `blocks`/`regions` carry the layout grouping (one `'ungrouped'` block
 * without a layout model); `image` is the frame all coordinates are relative to
 * — the corrected page after any orientation/dewarp pass, or the input.
 * @category Types
 * @typeParam L The layout region class-label type.
 */
export type OcrResult<L = never> = {
  readonly detections: OcrDetection[];
  readonly blocks: DocumentBlock<L>[];
  readonly regions: ObjectDetection<'xyxy', L>[];
  readonly image: ImageBuffer;
};

const RECOGNIZER_NORM: NormalizeOptions = { alpha: 1 / 127.5, beta: -1 }; // (x/255 - 0.5)/0.5 -> [-1, 1]
const RECOGNIZER_PAD_VALUE = 128; // neutral gray
const DEFAULT_ORIENTATION_MIN_CONFIDENCE = 0.85;

// Default layout-label conventions (PP-DocLayout); override via OcrModel.
const DEFAULT_VISUAL_LABELS = ['image', 'chart', 'seal'];
const DEFAULT_TABLE_LABEL = 'table';

// PP-DocLayout's RT-DETR head is set prediction, so it needs no IoU NMS — but it
// still emits nested duplicates (a line's own region inside the paragraph region
// that contains it). Since every region is OCR'd on its own crop, that transcribes
// the same text twice. Fraction of the smaller region that a larger one must cover
// for it to be dropped, as PaddleX's `layout_merge_bboxes_mode: 'large'` does.
const REGION_CONTAINMENT = 0.8;

function boxArea(box: BoundingBox<'xyxy'>): number {
  'worklet';
  return Math.max(0, box.xmax - box.xmin) * Math.max(0, box.ymax - box.ymin);
}

/**
 * Fraction of `inner`'s area that `outer` covers (intersection over the smaller box).
 * @param inner The box being tested for coverage.
 * @param outer The box that may cover it.
 * @returns The covered fraction in `[0,1]`.
 */
function coveredFraction(inner: BoundingBox<'xyxy'>, outer: BoundingBox<'xyxy'>): number {
  'worklet';
  const w = Math.min(inner.xmax, outer.xmax) - Math.max(inner.xmin, outer.xmin);
  const h = Math.min(inner.ymax, outer.ymax) - Math.max(inner.ymin, outer.ymin);
  const area = boxArea(inner);
  return w <= 0 || h <= 0 || area <= 0 ? 0 : (w * h) / area;
}

/**
 * Drops layout regions already covered by a larger kept one, largest first. Visual
 * regions never swallow anything — a caption inside a figure is still text to read.
 * @param regions The layout detector's regions.
 * @param visualLabels Labels carrying no text, which never suppress another region.
 * @returns The surviving regions, in the detector's original order.
 */
function mergeContainedRegions<L>(
  regions: ObjectDetection<'xyxy', L>[],
  visualLabels: readonly string[]
): ObjectDetection<'xyxy', L>[] {
  'worklet';
  const byArea = regions.map((_, i) => i);
  byArea.sort((a, b) => boxArea(regions[b]!.box) - boxArea(regions[a]!.box));
  const dropped = regions.map(() => false);
  for (let i = 0; i < byArea.length; i++) {
    const outer = byArea[i]!;
    if (dropped[outer] || visualLabels.includes(String(regions[outer]!.label))) {
      continue;
    }
    for (let j = i + 1; j < byArea.length; j++) {
      const inner = byArea[j]!;
      if (
        !dropped[inner] &&
        coveredFraction(regions[inner]!.box, regions[outer]!.box) >= REGION_CONTAINMENT
      ) {
        dropped[inner] = true;
      }
    }
  }
  return regions.filter((_, i) => !dropped[i]);
}

function makeBlock<L>(
  regionType: L | 'ungrouped',
  bbox: BoundingBox<'xyxy'>,
  layoutConfidence: number,
  lines: OcrDetection[],
  isTable: boolean
): DocumentBlock<L> {
  'worklet';
  const sorted = orderByReadingOrder(lines);
  return {
    regionType,
    bbox,
    layoutConfidence,
    isTable,
    lines: sorted,
    text: sorted.map((l) => l.text).join('\n'),
  };
}

/**
 * Creates the OCR runner for detect → recognize models (EasyOCR / PaddleOCR),
 * optionally composed with a layout detector and document-helper models. Per run:
 * orientation → dewarp → (layout ? per-region : whole-page) OCR → reading-ordered
 * blocks, with table regions filling their recognized structure.
 * @category Typescript API
 * @typeParam L The layout region class-label type.
 * @param config Model path + OCR options + optional layout / document models.
 * @param runtime Optional worklet runtime thread.
 * @returns A promise resolving to recognition and disposal controls.
 * @throws {RnExecuTorchError} With code `SCHEMA_MISMATCH` if the loaded model's
 * `detect`/`recognize` methods match none of the pipeline's spec variants.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if the model declares
 * a recognizer width-to-timestep relation the pipeline cannot satisfy, or if the
 * charset is shorter than the recognizer's vocabulary.
 */
export async function createOcr<L = never>(
  config: OcrModel<L>,
  runtime?: WorkletRuntime
): Promise<{
  dispose: () => void;
  runOcr: (input: ImageBuffer, options?: RunOcrOptions) => Promise<OcrResult<L>>;
  runOcrWorklet: (input: ImageBuffer, options?: RunOcrOptions) => OcrResult<L>;
}> {
  const { modelPath, modelOpts } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  // Contract validation can throw; a bad config must not leak the model.
  let engine!: OcrEngine;
  try {
    const contract = resolveOcrContract(model, modelOpts.charset, modelOpts.extractBoxes);
    engine = {
      model,
      extractBoxes: modelOpts.extractBoxes,
      det: { ...contract.det, norm: modelOpts.detectorNorm ?? IMAGENET_NORM },
      rec: {
        ...contract.rec,
        norm: modelOpts.recognizerNorm ?? RECOGNIZER_NORM,
        padValue: modelOpts.recognizerPadValue ?? RECOGNIZER_PAD_VALUE,
        padMode: modelOpts.recognizerPadMode ?? 'constant',
      },
      charset: contract.charset,
      minConfidence: modelOpts.minConfidence ?? 0,
      decode: modelOpts.decode,
    };
  } catch (e) {
    model.dispose();
    throw e;
  }

  // Optional document stages. A later stage failing to build must not leak the
  // ones already built (including the OCR model).
  let layout: Awaited<ReturnType<typeof createObjectDetector<'xyxy', L>>> | null = null;
  let documentModels: Awaited<ReturnType<typeof createDocumentModels>> | null = null;
  try {
    layout = config.layout ? await createObjectDetector<'xyxy', L>(config.layout, runtime) : null;
    documentModels = config.documentModels
      ? await createDocumentModels(config.documentModels, runtime)
      : null;
  } catch (e) {
    layout?.dispose();
    model.dispose();
    throw e;
  }

  const dm = config.documentModels;
  const hasTable = !!dm?.table;
  const defaultOrientation = !!dm?.orientation;
  const defaultDewarp = !!dm?.dewarp;
  const orientationMinConfidence =
    dm?.orientationMinConfidence ?? DEFAULT_ORIENTATION_MIN_CONFIDENCE;
  const visualLabels = config.visualLabels ?? DEFAULT_VISUAL_LABELS;
  const tableLabel = config.tableLabel ?? DEFAULT_TABLE_LABEL;

  const dispose = () => {
    model.dispose();
    layout?.dispose();
    documentModels?.dispose();
  };

  const runOcrWorklet = (input: ImageBuffer, options?: RunOcrOptions): OcrResult<L> => {
    'worklet';
    // `options` (RunOcrOptions) is structurally a superset of OcrPassOptions, so
    // the engine takes it directly — the orientation/dewarp fields it ignores.
    const useOrientation = !!documentModels && (options?.orientation ?? defaultOrientation);
    const useDewarp = !!documentModels && (options?.dewarp ?? defaultDewarp);
    // Tables are on whenever the model supports them (unlike orientation/dewarp,
    // which are opt-in) — a per-run `tables: false` skips the recognizer.
    const useTables = hasTable && (options?.tables ?? true);

    // Orientation / dewarp produce the corrected frame all coordinates are
    // relative to; without them the frame is the input unchanged. When a corrected
    // page tensor is produced it is kept alive (as `tCorrectedPage`) so the
    // whole-page pass can read it directly instead of round-tripping through the
    // materialized `img` buffer; the outer `finally` disposes it.
    let img = input;
    let tCorrectedPage: Tensor | null = null;
    let pw = input.width;
    let ph = input.height;
    try {
      if ((useOrientation || useDewarp) && documentModels) {
        const ch = FORMAT_CHANNELS[input.format];
        let changed = false;
        tCorrectedPage = tensor('uint8', [input.height, input.width, ch]);
        tCorrectedPage.setData(input.data);
        if (useOrientation) {
          const orientation = documentModels.detectOrientationWorklet(tCorrectedPage, input.format);
          const deg = ((360 - orientation.rotationCW) % 360) as 0 | 90 | 180 | 270;
          if (deg !== 0 && orientation.confidence >= orientationMinConfidence) {
            const swap = deg === 90 || deg === 270;
            const tRotated = tensor('uint8', [swap ? pw : ph, swap ? ph : pw, ch]);
            try {
              rotate(tCorrectedPage, tRotated, deg);
            } catch (e) {
              tRotated.dispose(); // rotate threw before we adopted `tRotated`
              throw e;
            }
            tCorrectedPage.dispose();
            tCorrectedPage = tRotated;
            changed = true;
            if (swap) {
              [pw, ph] = [ph, pw];
            }
          }
        }
        if (useDewarp) {
          // dewarp returns the input tensor unchanged when it declines the warp.
          const tDewarped = documentModels.dewarpWorklet(tCorrectedPage, input.format);
          if (tDewarped !== tCorrectedPage) {
            tCorrectedPage.dispose();
            tCorrectedPage = tDewarped;
            changed = true;
          }
        }
        // Only materialize a new frame when a correction was actually applied;
        // otherwise the input buffer is already that frame.
        if (changed) {
          const out = new Uint8Array(pw * ph * ch);
          tCorrectedPage.getData(out);
          img = { data: out, width: pw, height: ph, format: input.format, layout: input.layout };
        }
      }

      if (!layout) {
        const detections = tCorrectedPage
          ? runOcrPassOnTensor(engine, tCorrectedPage, pw, ph, input.format, options)
          : runOcrPass(engine, img, options);
        const blocks = detections.length
          ? [
              makeBlock<L>(
                'ungrouped',
                boundsOfPoints(
                  detections.flatMap((d) => d.quad),
                  'xyxy'
                ),
                1,
                detections,
                false
              ),
            ]
          : [];
        return { detections, blocks, regions: [], image: img };
      }

      // The layout path crops each region natively out of a live page tensor,
      // straight into the recognizer — no JS crop + re-upload per region. Reuse
      // the corrected page tensor if we made one; otherwise upload `img` once.
      // Ownership stays with `tCorrectedPage` so the outer `finally` frees it.
      const ch = FORMAT_CHANNELS[img.format];
      if (!tCorrectedPage) {
        tCorrectedPage = tensor('uint8', [img.height, img.width, ch]);
        tCorrectedPage.setData(img.data);
      }
      const tPage = tCorrectedPage;

      const regions = mergeContainedRegions(layout.detectObjectsWorklet(img), visualLabels);
      const blocks: DocumentBlock<L>[] = [];
      const detections: OcrDetection[] = [];
      for (const region of regions) {
        if (visualLabels.includes(String(region.label))) {
          continue;
        }
        const isTable = String(region.label) === tableLabel;
        const xmin = Math.max(0, Math.min(Math.round(region.box.xmin), img.width));
        const ymin = Math.max(0, Math.min(Math.round(region.box.ymin), img.height));
        const xmax = Math.max(0, Math.min(Math.round(region.box.xmax), img.width));
        const ymax = Math.max(0, Math.min(Math.round(region.box.ymax), img.height));
        if (xmax <= xmin || ymax <= ymin) {
          continue;
        }
        // Each region is OCR'd on its own crop for better dense-page recall; the
        // lines are offset back to page coordinates. The table encoder reads the
        // same crop tensor, so it stays alive until the region is fully handled.
        const tCrop = tensor('uint8', [ymax - ymin, xmax - xmin, ch]);
        try {
          crop(tPage, tCrop, { format: 'xyxy', xmin, ymin, xmax, ymax });
          const lines = runOcrPassOnTensor(
            engine,
            tCrop,
            xmax - xmin,
            ymax - ymin,
            img.format,
            options
          ).map((d) => ({
            ...d,
            quad: d.quad.map((p) => ({ x: p.x + xmin, y: p.y + ymin })),
          }));
          if (lines.length === 0 && !isTable) {
            continue;
          }
          detections.push(...lines);
          let block = makeBlock<L>(region.label, region.box, region.confidence, lines, isTable);
          if (isTable && documentModels && useTables) {
            const skeleton = documentModels.recognizeTableWorklet(tCrop, img.format);
            block = { ...block, tableHtml: fillTableCells(skeleton, block.lines) };
          }
          blocks.push(block);
        } finally {
          tCrop.dispose();
        }
      }
      // Order blocks with the same column-aware reading order as the flat
      // detections, so the two views of a multi-column page agree (a naive
      // y-then-x sort interleaves columns).
      const orderedBlocks = orderByReadingOrder(
        blocks.map((block) => ({ block, quad: quadFromBounds(block.bbox) }))
      ).map((w) => w.block);
      return {
        detections: orderByReadingOrder(detections),
        blocks: orderedBlocks,
        regions,
        image: img,
      };
    } finally {
      tCorrectedPage?.dispose();
    }
  };

  const runOcr = wrapAsync(runOcrWorklet, runtime);

  return { runOcr, runOcrWorklet, dispose };
}
