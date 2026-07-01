// OCR pipeline engine: the per-page / per-box worklet functions and the
// construction-time builders/validators behind `createOCR` (in ocr.ts). Split
// out to keep the task file focused on the public API + factory wiring.
// Everything here is internal — it is NOT re-exported from the package index.
//
// Worklet source-order rule: the worklet plugin captures referenced worklets in
// source order, so a worklet must be defined BEFORE any worklet that calls it
// (readStackedColumn -> detectQuads/recognizeGlyphStrip; readBoxVertical ->
// readStackedColumn/recognizeQuad). The non-worklet builders/validators run at
// construction time on the JS thread and have no such constraint.

import { tensor, type Tensor, type DType } from '../../../../core/tensor';
import { validateModelSchema, SymbolicTensor } from '../../../../core/modelSchema';
import type { Model } from '../../../../core/model';

import type { ImageFormat } from '../../image';
import type { Point } from '../../ops/points';
import {
  FORMAT_CONVERSION,
  resize,
  cvtColor,
  toChannelsFirst,
  normalize,
  type ColorConversionCode,
} from '../../ops/image';
import {
  extractTextBoxes,
  warpQuad,
  ctcGreedyDecode,
  type CraftExtractOptions,
  type DbnetExtractOptions,
  type Quad,
} from '../../ops/textBoxes';
import {
  mapQuadToImage,
  orderQuad,
  quadSize,
  contentWidthFor,
  flattenQuad,
  decodeGreedy,
  ctcConfidence,
  snapDetectBucket,
  snapRecognizeBucket,
  splitTallQuad,
} from './ocrHelpers';

// Detector input is raw RGB scaled to [0,1]; the per-architecture mean/std is
// baked into the PTE, so the client only divides by 255.
const DETECTOR_ALPHA = 1 / 255;
const DETECTOR_BETA = 0;

// Detector box-extraction tuning. These are stable across models and not worth
// exposing as options — bake them in. (CRAFT = EasyOCR, DBNet = PaddleOCR.)
const CRAFT_TEXT_THRESHOLD = 0.4;
const CRAFT_LINK_THRESHOLD = 0.4;
const CRAFT_LOW_TEXT_THRESHOLD = 0.7;
const DBNET_BIN_THRESHOLD = 0.3;
const DBNET_BOX_THRESHOLD = 0.6;
const DBNET_UNCLIP_RATIO = 1.5;
const DBNET_MIN_BOX_SIDE = 3;
const DBNET_MAX_CANDIDATES = 1000;
// DBNet exports a post-sigmoid prob map, so don't re-apply sigmoid (true only for
// raw-logit heads).
const APPLY_SIGMOID = false;

// Stored at construction; CRAFT's `targetHeight` is per-run, so detectQuads adds it.
export type DetectorExtractConfig = Omit<CraftExtractOptions, 'targetHeight'> | DbnetExtractOptions;

// Per-detect-bucket scratch tensors, allocated once at construction (like RecSet)
// and reused across the page pass and per-box re-detects. Only the source-resize
// tensor depends on the run's input channel count, so detectQuads allocates that
// one per call and reuses the rest from here.
export type DetSet = {
  readonly s: number;
  readonly tColor: Tensor; // [s, s, 3]
  readonly tCF: Tensor; // [3, s, s]
  readonly tNorm: Tensor; // [3, s, s]
  readonly tInput: Tensor; // [1, 3, s, s]
  // The detector's output tensors (dbnet prob-map / craft heatmap+extras / a
  // custom arch's raw outputs); the built-in decoder reads tOutputs[0].
  readonly tOutputs: readonly Tensor[];
};

// Everything the detector pass needs, bundled so it can run both on the full
// page and (for vertical text) on a single box crop to find its characters.
export type DetectContext = {
  readonly model: Model;
  readonly detBuckets: readonly number[];
  readonly numChannels: number;
  readonly detCode: ColorConversionCode | null;
  // Built-in decode config (craft/dbnet); undefined when a custom extractor is used.
  readonly extractOpts?: DetectorExtractConfig;
  // Custom TS box extractor for detectorKind 'custom'; takes precedence when set.
  readonly extractBoxes?: (outputs: readonly Tensor[], s: number) => Quad[];
  readonly detSets: ReadonlyMap<number, DetSet>;
};

// A recognizer width bucket's pre-allocated tensor-set (one per width in the
// model's `recognize` buckets).
export type RecSet = {
  readonly width: number;
  readonly tCanvas: Tensor;
  readonly tCF: Tensor;
  readonly tNorm: Tensor;
  readonly tInput: Tensor;
  readonly tLogits: Tensor;
};

// Recognizer state for reading one quad. The source image is passed per call,
// so the same context reads both the full page and a per-box crop.
export type RecContext = {
  readonly model: Model;
  readonly recSetByWidth: ReadonlyMap<number, RecSet>;
  readonly recBuckets: readonly number[];
  readonly recH: number;
  readonly charset: string[];
  // Per-model recognizer normalization / pad (resolved from OCROptions defaults).
  readonly normAlpha: number | readonly number[];
  readonly normBeta: number | readonly number[];
  readonly padValue: number;
  // Optional custom decode; falls back to greedy CTC when absent.
  readonly decode?: (
    logits: Tensor,
    charset: readonly string[]
  ) => { readonly text: string; readonly confidence: number };
};

// State the vertical-text path needs on top of `RecContext`: the detector (for
// the second, character-level pass) and the page tensors it crops the box from.
export type VerticalContext = {
  readonly detCtx: DetectContext;
  readonly rawPage: Tensor; // full page, native format — cropped per box for re-detection
  readonly recCode: ColorConversionCode | null; // native format -> recognizer color
  readonly recC: number;
  readonly tallCropRatio: number; // height/width ratio above which a box is a column
  // Per-page budget for the (expensive) stacked-column re-detection pass.
  readonly redetectBudget: { remaining: number };
};

// cvtColor code to bring a source image format to RGB (both the detector and the
// recognizer operate on RGB), or null when it already is RGB.
export function toRgbCode(format: ImageFormat): ColorConversionCode | null {
  'worklet';
  return FORMAT_CONVERSION[format].rgb;
}

// Detects text boxes in `src` (uint8 [H,W,numChannels], native `format`) and
// returns quads in `src` pixel space: letterbox into the snapped square bucket,
// run `detect_<S>`, extract quads. Scratch is the bucket's cached DetSet; only
// the source-resize tensor (input-channel-dependent) is allocated/freed here.
export function detectQuads(
  ctx: DetectContext,
  src: Tensor,
  width: number,
  height: number,
  charLevel = false
): Point[][] {
  'worklet';
  const detS = snapDetectBucket(width, height, ctx.detBuckets);
  // snapDetectBucket always returns one of detBuckets, so the set exists.
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
    // A custom arch hands its raw outputs to the user extractor; the built-ins
    // decode the heatmap (tOutputs[0]). CRAFT needs the per-run input height to
    // restore its half-res boxes; `charLevel` switches to per-glyph boxes.
    const quads = ctx.extractBoxes
      ? ctx.extractBoxes(detSet.tOutputs, detS)
      : extractTextBoxes(
          detSet.tOutputs[0]!,
          ctx.extractOpts!.mode === 'craft'
            ? { ...ctx.extractOpts!, targetHeight: detS, charLevel }
            : ctx.extractOpts!
        );
    return quads.map((q) => mapQuadToImage(q, detS, detS, width, height));
  } finally {
    tDetResize.dispose();
  }
}

// Recognizes one ordered (TL,TR,BR,BL) quad from `src`: snap content width to a
// recognizer bucket, warp -> normalize -> execute -> greedy-CTC decode.
export function recognizeQuad(
  ctx: RecContext,
  src: Tensor,
  corners: readonly Point[]
): { text: string; conf: number } {
  'worklet';
  const cs = quadSize(corners);
  const maxRec = ctx.recBuckets[ctx.recBuckets.length - 1]!;
  const desiredW = contentWidthFor(cs.width, cs.height, ctx.recH, maxRec);
  const bucketW = snapRecognizeBucket(desiredW, ctx.recBuckets);
  // snapRecognizeBucket always returns one of recBuckets, so the set exists.
  const recSet = ctx.recSetByWidth.get(bucketW)!;
  const contentWidth = Math.min(desiredW, bucketW);
  warpQuad(src, recSet.tCanvas, flattenQuad(corners), {
    contentWidth,
    align: 'left',
    padMode: 'constant',
    padValue: ctx.padValue,
  });
  recSet.tCanvas
    .through(toChannelsFirst, recSet.tCF)
    .through(normalize, recSet.tNorm, { alpha: ctx.normAlpha, beta: ctx.normBeta })
    .copyTo(recSet.tInput);
  ctx.model.execute(`recognize_${bucketW}`, [recSet.tInput], [recSet.tLogits]);
  // A custom decode (e.g. attention/AR head) takes the raw logits; otherwise
  // greedy CTC. Both heads emit probabilities (CRNN softmax baked, SVTR pre-softmaxed).
  if (ctx.decode) {
    const r = ctx.decode(recSet.tLogits, ctx.charset);
    return { text: r.text, conf: r.confidence };
  }
  const { indices, values } = ctcGreedyDecode(recSet.tLogits, { softmax: false });
  const text = decodeGreedy(indices, ctx.charset);
  const conf = ctcConfidence(values, indices);
  return { text, conf };
}

// Joins glyph quads (in `src` pixel space, reading order) into one recognizer
// strip: each glyph is warped upright to the recognizer height and placed side by
// side directly in the canvas (native `warpQuad` with a per-glyph `offsetX`, so
// there is no JS pixel assembly), then recognized as a single line. Returns null
// when nothing usable was assembled.
//
// Must be defined BEFORE its callers: the worklet plugin captures referenced
// worklets in source order, so a forward reference is undefined at run time.
export function recognizeGlyphStrip(
  recCtx: RecContext,
  src: Tensor,
  glyphs: readonly (readonly Point[])[]
): { text: string; conf: number } | null {
  'worklet';
  const recH = recCtx.recH;
  const maxRec = recCtx.recBuckets[recCtx.recBuckets.length - 1]!;
  // Pass 1 (geometry only): a box much taller than wide is a merged run of stacked
  // letters — split it into ~square single-letter cells so each lands in its own
  // strip slot. Measure each cell's warped width (aspect preserved) to size the strip.
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
      const width = Math.max(
        1,
        Math.min(Math.round((cellSize.width * recH) / cellSize.height), maxRec)
      );
      cells.push({ quad: cell, width });
      totalW += width;
    }
  }
  if (cells.length === 0) {
    return null;
  }
  // Smallest bucket that fits the strip (snap up, no glyph truncated); widest for
  // very long columns.
  const bucketW =
    recCtx.recBuckets.find((w) => w >= totalW) ?? recCtx.recBuckets[recCtx.recBuckets.length - 1]!;
  const recSet = recCtx.recSetByWidth.get(bucketW)!;
  // Pass 2: warp each cell straight into the canvas at its x-offset. The first warp
  // clears + pads the whole canvas; the rest compose in with `clear: false`.
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
  recSet.tCanvas
    .through(toChannelsFirst, recSet.tCF)
    .through(normalize, recSet.tNorm, { alpha: recCtx.normAlpha, beta: recCtx.normBeta })
    .copyTo(recSet.tInput);
  recCtx.model.execute(`recognize_${bucketW}`, [recSet.tInput], [recSet.tLogits]);
  if (recCtx.decode) {
    const decoded = recCtx.decode(recSet.tLogits, recCtx.charset);
    return decoded.text.length > 0 ? { text: decoded.text, conf: decoded.confidence } : null;
  }
  const { indices, values } = ctcGreedyDecode(recSet.tLogits, { softmax: false });
  const text = decodeGreedy(indices, recCtx.charset);
  const conf = ctcConfidence(values, indices);
  return text.length > 0 ? { text, conf } : null;
}

// Reads a single tall box that packs several stacked glyphs the detector grouped
// into one box (e.g. a tightly-set container code): crop it upright, re-detect
// the glyphs (char-level pass), and read them top -> bottom as a joined strip.
// Returns null — caller falls back to a horizontal read — when the box is tiny,
// the per-page re-detect budget is spent, or nothing is found.
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
  const recC = vctx.recC;
  const tBoxRaw = tensor('uint8', [boxH, boxW, vctx.detCtx.numChannels]);
  const tRecBox = tensor('uint8', [boxH, boxW, recC]);
  try {
    // Axis-aligned upright crop of the box, full width (no padding).
    warpQuad(vctx.rawPage, tBoxRaw, flattenQuad(ordered), {
      contentWidth: boxW,
      align: 'left',
      padMode: 'constant',
      padValue: 0,
    });
    // Char-level second pass: per-glyph boxes (no grouping), in crop pixel space.
    const charQuads = detectQuads(vctx.detCtx, tBoxRaw, boxW, boxH, /* charLevel */ true);
    if (charQuads.length === 0) {
      return null;
    }
    const boxSrc = vctx.recCode !== null ? cvtColor(tBoxRaw, tRecBox, vctx.recCode) : tBoxRaw;
    // Stack reading order: top -> bottom by each glyph's upper edge.
    const glyphs = charQuads.map((q) => orderQuad(q)).sort((a, b) => a[0]!.y - b[0]!.y);
    return recognizeGlyphStrip(recCtx, boxSrc, glyphs);
  } finally {
    tBoxRaw.dispose();
    tRecBox.dispose();
  }
}

// Reads one box that may be an upright stacked column (e.g. a shipping-container
// code, letters stacked top-to-bottom). A normal-aspect box is read horizontally;
// a tall box is read as a stacked column, falling back to the horizontal read.
// `stacked` reports whether the column path produced the read (caller applies the
// lenient vertical drop-score to those).
export function readBoxVertical(
  recCtx: RecContext,
  vctx: VerticalContext,
  pageSrc: Tensor,
  ordered: readonly Point[],
  size: { width: number; height: number }
): { text: string; conf: number; stacked: boolean } {
  'worklet';
  if (size.height >= size.width * vctx.tallCropRatio) {
    const stacked = readStackedColumn(recCtx, vctx, ordered, size);
    if (stacked) {
      return { ...stacked, stacked: true };
    }
  }
  return { ...recognizeQuad(recCtx, pageSrc, ordered), stacked: false };
}

// Validates the detector methods against the architecture's input/output spec
// and returns CRAFT's extra-output channel counts (empty for dbnet/custom). For
// 'custom' only the shared RGB input contract is enforced — outputs are read from
// the PTE metadata and handed to the user's extractBoxes. Throws on any mismatch.
export function validateDetectorSchema(
  model: Model,
  detBuckets: readonly number[],
  detectorKind: 'craft' | 'dbnet' | 'custom',
  extractBoxes?: (outputs: readonly Tensor[], s: number) => Quad[]
): number[] {
  // CRAFT's half-resolution heatmap needs even detect-bucket sides.
  if (detectorKind === 'craft' && detBuckets.some((s) => s % 2 !== 0)) {
    throw new Error('OCR: every CRAFT detect bucket side must be even (half-resolution heatmap).');
  }
  const detInSpec = [SymbolicTensor('float32', [1, 3, 'H', 'W'])];
  if (detectorKind === 'custom') {
    if (!extractBoxes) {
      throw new Error("OCR: detectorKind 'custom' requires an extractBoxes worklet.");
    }
    // Outputs are arbitrary (read from metadata, handed to extractBoxes); only
    // the shared RGB input contract is enforced. getMethodMeta throws if missing.
    for (const s of detBuckets) {
      const inShape = model.getMethodMeta(`detect_${s}`).inputTensorMeta[0]?.shape;
      if (!inShape || inShape.length !== 4 || inShape[1] !== 3) {
        throw new Error(`OCR: detect_${s} must take a [1, 3, ${s}, ${s}] RGB input.`);
      }
    }
    return [];
  }
  // Validate every detect bucket against the architecture's output spec; keep
  // the largest bucket's meta for the constant CRAFT extra-output channels.
  const detOutSpec =
    detectorKind === 'dbnet'
      ? [SymbolicTensor('float32', [1, 1, 'H', 'W'], [1, 'H', 'W'], ['H', 'W'])]
      : [
          SymbolicTensor('float32', [1, 'H', 'W', 2], ['H', 'W', 2]),
          SymbolicTensor('float32', [1, 'C', 'fH', 'fW']),
        ];
  const detMeta = validateModelSchema(
    model,
    `detect_${detBuckets[detBuckets.length - 1]}`,
    detInSpec,
    detOutSpec
  );
  for (let i = 0; i < detBuckets.length - 1; i++) {
    validateModelSchema(model, `detect_${detBuckets[i]}`, detInSpec, detOutSpec);
  }
  // CRAFT's extra outputs (feature map) at half resolution; keep the channel counts.
  return detMeta.outputTensorMeta.slice(1).map((t) => t.shape[1]!);
}

// Built-in box-decode config for a detector kind (custom archs decode in TS via
// extractBoxes instead, so they get `undefined`).
export function buildExtractOpts(
  detectorKind: 'craft' | 'dbnet' | 'custom'
): DetectorExtractConfig | undefined {
  if (detectorKind === 'custom') {
    return undefined;
  }
  return detectorKind === 'dbnet'
    ? {
        mode: 'dbnet',
        binThreshold: DBNET_BIN_THRESHOLD,
        boxThreshold: DBNET_BOX_THRESHOLD,
        unclipRatio: DBNET_UNCLIP_RATIO,
        minBoxSide: DBNET_MIN_BOX_SIDE,
        maxCandidates: DBNET_MAX_CANDIDATES,
        applySigmoid: APPLY_SIGMOID,
      }
    : {
        mode: 'craft',
        textThreshold: CRAFT_TEXT_THRESHOLD,
        linkThreshold: CRAFT_LINK_THRESHOLD,
        lowTextThreshold: CRAFT_LOW_TEXT_THRESHOLD,
      };
}

// Per-detect-bucket output tensor specs (dtype + shape). Custom archs declare
// arbitrary outputs — read straight from the PTE's method metadata; the built-ins
// have known heatmap (+ craft extras) shapes. Returns specs only (no tensors); the
// task factory allocates and owns them (see DetSet in createOCR). Runs at
// construction.
export function deriveDetectorOutputs(
  model: Model,
  detBuckets: readonly number[],
  detectorKind: 'craft' | 'dbnet' | 'custom',
  detExtraChannels: readonly number[]
): { s: number; outputs: { dtype: DType; shape: number[] }[] }[] {
  return detBuckets.map((s) => {
    const heat = s / 2;
    if (detectorKind === 'custom') {
      const outputs = model
        .getMethodMeta(`detect_${s}`)
        .outputTensorMeta.map((m) => ({ dtype: m.dtype, shape: m.shape }));
      return { s, outputs };
    }
    const heatmap: { dtype: DType; shape: number[] } =
      detectorKind === 'dbnet'
        ? { dtype: 'float32', shape: [1, 1, s, s] }
        : { dtype: 'float32', shape: [1, heat, heat, 2] };
    const outputs = [
      heatmap,
      ...detExtraChannels.map((c) => ({ dtype: 'float32' as DType, shape: [1, c, heat, heat] })),
    ];
    return { s, outputs };
  });
}

// Validates each `recognize_<W>` method and derives the recognizer contract:
// the constant channel/height/vocab (from the first bucket) plus each bucket's
// input/output shapes. Returns specs only (no tensors); the task factory allocates
// and owns the RecSet tensors. Runs at construction.
export function deriveRecognizerContract(
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
      // Channels/height/vocab are constant across the width buckets.
      recC = inShape[1]!;
      recH = inShape[2]!;
      vocabSize = outShape[2]!;
    }
    return { width: w, inShape, outShape };
  });
  return { recC, recH, vocabSize, buckets };
}

// Frees a detector scratch-set's tensors (input prep + per-bucket outputs).
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
