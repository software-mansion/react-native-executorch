// OCR pipeline engine: the per-page / per-box worklet functions and the
// construction-time contract resolvers behind `createOcr` (in ocr.ts). Internal
// to the OCR task — not re-exported from the package index.
//
// Worklet source-order: the worklet plugin captures a referenced worklet by its
// position in this file, so a worklet must be defined before any worklet that
// calls it (recognizeCanvas -> recognizeQuad/recognizeGlyphStrip;
// recognizeGlyphStrip -> readStackedColumn). The construction-time resolvers run
// on the JS thread and have no such constraint.

import { rnexecutorchJsi } from '../../../../native/bridge';
import { tensor, type Tensor, type DType } from '../../../../core/tensor';
import { validateModelSchema, SymbolicTensor } from '../../../../core/modelSchema';
import type { Model } from '../../../../core/model';

import type { Point } from '../../ops/points';
import {
  resize,
  cvtColor,
  toChannelsFirst,
  normalize,
  warpQuad,
  type ColorConversionCode,
} from '../../ops/image';
import { mapQuadToImage, orderQuad, quadSize, flattenQuad, splitTallQuad } from '../../ops/quad';
import type { TextBoxExtractor } from './detectors';
import { contentWidthFor, ctcCollapse, snapDetectBucket, snapRecognizeBucket } from './ocrUtils';

// The detector consumes raw RGB scaled to [0,1]; its mean/std normalization is
// baked into the model, so the client only divides by 255.
const DETECTOR_ALPHA = 1 / 255;
const DETECTOR_BETA = 0;

// Per-timestep argmax + max value over recognizer logits `[..,T,V]`, computed
// natively on the tensor buffer (avoids copying the whole tensor into JS). The
// native op returns a flat [idx, value, ...] array, reshaped here.
function ctcGreedyDecode(src: Tensor): { indices: number[]; values: number[] } {
  'worklet';
  const flat = rnexecutorchJsi.cv.ctcGreedyDecode(src) as number[];
  const indices: number[] = [];
  const values: number[] = [];
  for (let i = 0; i < flat.length; i += 2) {
    indices.push(flat[i]!);
    values.push(flat[i + 1]!);
  }
  return { indices, values };
}

/** Per-detect-bucket scratch tensors, allocated once and reused across runs. */
export type DetSet = {
  readonly s: number;
  readonly tColor: Tensor; // [s, s, 3]
  readonly tCF: Tensor; // [3, s, s]
  readonly tNorm: Tensor; // [3, s, s]
  readonly tInput: Tensor; // [1, 3, s, s]
  readonly tOutputs: readonly Tensor[];
};

/** The detector state, bundled so it can run on the full page or on a box crop. */
export type DetectContext = {
  readonly model: Model;
  readonly detBuckets: readonly number[];
  readonly numChannels: number;
  readonly detCode: ColorConversionCode | null;
  readonly extractBoxes: TextBoxExtractor;
  readonly detSets: ReadonlyMap<number, DetSet>;
};

/** Per-recognize-width scratch tensors, allocated once and reused across runs. */
export type RecSet = {
  readonly width: number;
  readonly tCanvas: Tensor;
  readonly tCF: Tensor;
  readonly tNorm: Tensor;
  readonly tInput: Tensor;
  readonly tLogits: Tensor;
};

/** The recognizer state; the source image is passed per call. */
export type RecContext = {
  readonly model: Model;
  readonly recSetByWidth: ReadonlyMap<number, RecSet>;
  readonly recBuckets: readonly number[];
  readonly recH: number;
  readonly charset: string[];
  readonly normAlpha: number | readonly number[];
  readonly normBeta: number | readonly number[];
  readonly padValue: number;
  // Optional custom decode; falls back to greedy CTC when absent.
  readonly decode?: (
    logits: Tensor,
    charset: readonly string[]
  ) => { readonly text: string; readonly confidence: number };
};

/** Extra state the vertical-text path needs: the detector and the source page. */
export type VerticalContext = {
  readonly detCtx: DetectContext;
  readonly rawPage: Tensor;
  readonly recC: number;
  // Height/width ratio above which a box is treated as a stacked column.
  readonly tallCropRatio: number;
  // Per-page budget for the (expensive) stacked-column re-detection pass.
  readonly redetectBudget: { remaining: number };
};

// Detects text boxes in `src` and returns their quads in `src` pixel space:
// letterbox into the snapped square bucket, run the detector, and hand the raw
// outputs to the model's extractor. `charLevel` requests per-glyph boxes for the
// stacked-text pass.
export function detectQuads(
  ctx: DetectContext,
  src: Tensor,
  width: number,
  height: number,
  charLevel = false
): Point[][] {
  'worklet';
  const detS = snapDetectBucket(width, height, ctx.detBuckets);
  const detSet = ctx.detSets.get(detS)!;
  // Only the source resize depends on the run's channel count; the rest is cached.
  const tDetResize = tensor('uint8', [detS, detS, ctx.numChannels]);
  try {
    src
      .through(resize, tDetResize, { mode: 'letterbox', interpolation: 'area', padValue: 0 })
      .throughIf(ctx.detCode !== null, cvtColor, detSet.tColor, ctx.detCode!)
      .through(toChannelsFirst, detSet.tCF)
      .through(normalize, detSet.tNorm, { alpha: DETECTOR_ALPHA, beta: DETECTOR_BETA })
      .copyTo(detSet.tInput);

    ctx.model.execute(`detect_${detS}`, [detSet.tInput], [...detSet.tOutputs]);
    const quads = ctx.extractBoxes(detSet.tOutputs, detS, charLevel);
    return quads.map((q) => mapQuadToImage(q, detS, detS, width, height));
  } finally {
    tDetResize.dispose();
  }
}

// Normalizes the already-warped recognizer canvas, runs the recognizer, and
// decodes the logits — a custom decode if the model provides one, else greedy CTC
// (the recognizer emits probabilities). Callers prepare `tCanvas` via `warpQuad`.
function recognizeCanvas(
  recCtx: RecContext,
  recSet: RecSet,
  bucketW: number
): { text: string; conf: number } {
  'worklet';
  recSet.tCanvas
    .through(toChannelsFirst, recSet.tCF)
    .through(normalize, recSet.tNorm, { alpha: recCtx.normAlpha, beta: recCtx.normBeta })
    .copyTo(recSet.tInput);
  recCtx.model.execute(`recognize_${bucketW}`, [recSet.tInput], [recSet.tLogits]);
  if (recCtx.decode) {
    const r = recCtx.decode(recSet.tLogits, recCtx.charset);
    return { text: r.text, conf: r.confidence };
  }
  const { indices, values } = ctcGreedyDecode(recSet.tLogits);
  const { text, confidence } = ctcCollapse(indices, values, recCtx.charset);
  return { text, conf: confidence };
}

// Recognizes one ordered (TL,TR,BR,BL) quad from `src`: snap its content width to
// a recognizer bucket, warp it into the canvas, then recognize.
export function recognizeQuad(
  ctx: RecContext,
  src: Tensor,
  corners: readonly Point[]
): { text: string; conf: number } {
  'worklet';
  const size = quadSize(corners);
  const maxRec = ctx.recBuckets[ctx.recBuckets.length - 1]!;
  const desiredW = contentWidthFor(size.width, size.height, ctx.recH, maxRec);
  const bucketW = snapRecognizeBucket(desiredW, ctx.recBuckets);
  const recSet = ctx.recSetByWidth.get(bucketW)!;
  warpQuad(src, recSet.tCanvas, flattenQuad(corners), {
    contentWidth: Math.min(desiredW, bucketW),
    align: 'left',
    padMode: 'constant',
    padValue: ctx.padValue,
  });
  return recognizeCanvas(ctx, recSet, bucketW);
}

// Recognizes a sequence of glyph quads as a single line: each glyph is warped
// upright to the recognizer height and placed side by side in one canvas (the
// native warp composes directly, so there is no JS pixel assembly), then read in
// one pass. A glyph box much taller than wide is first split into ~square
// single-letter cells. Returns null when no usable text was produced.
export function recognizeGlyphStrip(
  recCtx: RecContext,
  src: Tensor,
  glyphs: readonly (readonly Point[])[]
): { text: string; conf: number } | null {
  'worklet';
  const recH = recCtx.recH;
  const maxRec = recCtx.recBuckets[recCtx.recBuckets.length - 1]!;
  // Split any tall multi-letter box into single-letter cells and size each cell's
  // warped width (aspect preserved) to lay out the strip.
  const cells: { quad: readonly Point[]; width: number }[] = [];
  let totalW = 0;
  for (const glyph of glyphs) {
    const glyphSize = quadSize(glyph);
    if (glyphSize.width < 1 || glyphSize.height < 1) {
      continue;
    }
    const parts = Math.max(1, Math.round(glyphSize.height / Math.max(1, glyphSize.width)));
    for (const cell of splitTallQuad(glyph, parts)) {
      const cellSize = quadSize(cell);
      if (cellSize.width < 1 || cellSize.height < 1) {
        continue;
      }
      const width = contentWidthFor(cellSize.width, cellSize.height, recH, maxRec);
      cells.push({ quad: cell, width });
      totalW += width;
    }
  }
  if (cells.length === 0) {
    return null;
  }
  const bucketW = snapRecognizeBucket(totalW, recCtx.recBuckets);
  const recSet = recCtx.recSetByWidth.get(bucketW)!;
  // Warp each cell into the canvas at its x-offset; the first warp clears + pads
  // the whole canvas, the rest compose in with `clear: false`.
  let xOff = 0;
  for (let i = 0; i < cells.length; i++) {
    if (xOff >= bucketW) {
      break;
    }
    warpQuad(src, recSet.tCanvas, flattenQuad(cells[i]!.quad), {
      contentWidth: cells[i]!.width,
      offsetX: xOff,
      clear: i === 0,
      padMode: 'constant',
      padValue: recCtx.padValue,
    });
    xOff += cells[i]!.width;
  }
  const { text, conf } = recognizeCanvas(recCtx, recSet, bucketW);
  return text.length > 0 ? { text, conf } : null;
}

// Reads one tall box that the detector merged from several vertically-stacked
// glyphs: crops it upright, re-detects the individual glyphs (char-level pass),
// and recognizes them top-to-bottom via `recognizeGlyphStrip`. Returns null — the
// caller then reads the box horizontally — when the box is too small, the per-page
// re-detect budget is spent, or no glyphs are found.
export function readStackedColumn(
  recCtx: RecContext,
  vctx: VerticalContext,
  ordered: readonly Point[],
  size: { width: number; height: number }
): { text: string; conf: number } | null {
  'worklet';
  const boxW = Math.round(size.width);
  const boxH = Math.round(size.height);
  if (boxW < 3 || boxH < 3 || vctx.redetectBudget.remaining <= 0) {
    return null;
  }
  vctx.redetectBudget.remaining--;
  const tBoxRaw = tensor('uint8', [boxH, boxW, vctx.detCtx.numChannels]);
  // RGB conversion target — allocated lazily, only when the crop isn't RGB.
  let tRecBox: Tensor | null = null;
  try {
    warpQuad(vctx.rawPage, tBoxRaw, flattenQuad(ordered), {
      contentWidth: boxW,
      align: 'left',
      padMode: 'constant',
      padValue: 0,
    });
    const charQuads = detectQuads(vctx.detCtx, tBoxRaw, boxW, boxH, /* charLevel */ true);
    if (charQuads.length === 0) {
      return null;
    }
    let boxSrc = tBoxRaw;
    if (vctx.detCtx.detCode !== null) {
      tRecBox = tensor('uint8', [boxH, boxW, vctx.recC]);
      boxSrc = cvtColor(tBoxRaw, tRecBox, vctx.detCtx.detCode);
    }
    // Read the stack top-to-bottom by each glyph's upper edge.
    const glyphs = charQuads.map((q) => orderQuad(q)).sort((a, b) => a[0]!.y - b[0]!.y);
    return recognizeGlyphStrip(recCtx, boxSrc, glyphs);
  } finally {
    tBoxRaw.dispose();
    tRecBox?.dispose();
  }
}

// Validates each `detect_<S>` method against the shared RGB `[1, 3, S, S]` input
// contract and reads its (model-defined) output tensor specs from the model
// metadata. Returns specs only — the task factory allocates and owns the tensors.
// Runs at construction; throws on a contract mismatch.
export function resolveDetectorContract(
  model: Model,
  detBuckets: readonly number[]
): { s: number; outputs: { dtype: DType; shape: number[] }[] }[] {
  return detBuckets.map((s) => {
    const method = `detect_${s}`;
    // Match the declared output count with wildcard specs so validateModelSchema
    // enforces the RGB input contract without constraining the model's outputs.
    const outCount = model.getMethodMeta(method).outputTensorMeta.length;
    const meta = validateModelSchema(
      model,
      method,
      [SymbolicTensor('float32', [1, 3, s, s])],
      Array.from({ length: outCount }, () => SymbolicTensor())
    );
    return { s, outputs: meta.outputTensorMeta.map((m) => ({ dtype: m.dtype, shape: m.shape })) };
  });
}

// Validates each `recognize_<W>` method and reads the recognizer contract: the
// channel/height/vocab dimensions (constant across widths) plus each bucket's
// input/output shapes. Returns specs only — the task factory allocates the
// tensors. Runs at construction; throws on a contract mismatch.
export function resolveRecognizerContract(
  model: Model,
  recBuckets: readonly number[]
): {
  recC: number;
  recH: number;
  vocabSize: number;
  buckets: { width: number; inShape: number[]; outShape: number[] }[];
} {
  let recC = 0;
  let recH = 0;
  let vocabSize = 0;
  const buckets = recBuckets.map((w, i) => {
    const m = validateModelSchema(
      model,
      `recognize_${w}`,
      [SymbolicTensor('float32', [1, 'C', 'H', 'W'])],
      [SymbolicTensor('float32', [1, 'T', 'V'])]
    );
    const inShape = m.inputTensorMeta[0]!.shape;
    const outShape = m.outputTensorMeta[0]!.shape;
    if (i === 0) {
      recC = inShape[1]!;
      recH = inShape[2]!;
      vocabSize = outShape[2]!;
    }
    return { width: w, inShape, outShape };
  });
  return { recC, recH, vocabSize, buckets };
}

// Frees a detector scratch-set's tensors.
export function disposeDetSets(detSets: readonly DetSet[]): void {
  for (const d of detSets) {
    d.tColor.dispose();
    d.tCF.dispose();
    d.tNorm.dispose();
    d.tInput.dispose();
    for (const t of d.tOutputs) {
      t.dispose();
    }
  }
}

// Frees a recognizer scratch-set's tensors.
export function disposeRecSets(recSets: readonly RecSet[]): void {
  for (const s of recSets) {
    s.tCanvas.dispose();
    s.tCF.dispose();
    s.tNorm.dispose();
    s.tInput.dispose();
    s.tLogits.dispose();
  }
}
