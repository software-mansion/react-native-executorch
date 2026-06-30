import type { WorkletRuntime } from 'react-native-worklets';

import { tensor, type Tensor } from '../../../core/tensor';
import { loadModel, type Model } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';

import type { ImageBuffer, ImageFormat } from '../image';
import type { Point } from '../ops/points';
import {
  FORMAT_CONVERSION,
  FORMAT_CHANNELS,
  resize,
  cvtColor,
  toChannelsFirst,
  normalize,
  extractTextBoxes,
  warpQuad,
  ctcGreedyDecode,
  type ColorConversionCode,
  type CraftExtractOptions,
  type DbnetExtractOptions,
  type Quad,
} from '../ops/image';
import {
  buildCharset,
  mapQuadToImage,
  orderQuad,
  quadSize,
  contentWidthFor,
  flattenQuad,
  decodeGreedy,
  ctcConfidence,
  nowMs,
  snapDetectBucket,
  snapRecognizeBucket,
  readingOrderIndices,
  type Buckets,
} from './ocrHelpers';

export type { Buckets } from './ocrHelpers';

/**
 * Configuration for the unified OCR pipeline. A model declares its detector
 * architecture, its input-size buckets, and its charset; the detector/recognizer
 * share one baked contract whose defaults match CRAFT (EasyOCR) and DBNet
 * (PaddleOCR). Models that diverge can override the recognizer normalization,
 * padding, and decode, or supply a `'custom'` detector with its own box
 * extraction — see the per-field options below.
 * @category Types
 */
export type OCROptions = {
  /**
   * Detector architecture — selects the box decoder (CRAFT heatmap grouping vs
   * DBNet prob-map) and the default drop score. Use `'custom'` for any other
   * architecture and supply {@link OCROptions.extractBoxes} to turn the raw
   * detector output into quads in TypeScript.
   */
  readonly detectorKind: 'craft' | 'dbnet' | 'custom';
  /**
   * The model's static input-size buckets. The pipeline snaps each image to the
   * closest `detect`/`recognize` bucket and calls the matching per-size method
   * (`detect_<S>` / `recognize_<W>`). See {@link Buckets}.
   */
  readonly buckets: Buckets;
  /**
   * Recognizer charset (a string = one codepoint per index; an array is taken
   * verbatim, for multi-codepoint entries like ligatures).
   */
  readonly charset: string | readonly string[];
  /** Drop detections below this confidence. Defaults per detector architecture. */
  readonly dropScore?: number;
  /**
   * Custom detector post-processing, required when `detectorKind === 'custom'`.
   * Receives the raw `detect_<S>` output tensors (the model's declared outputs,
   * in order — shapes read from the PTE, allocated for you) and the snapped
   * square side `s`, and returns oriented quads in DETECTOR space (the `s × s`
   * letterboxed input); the pipeline maps them to image pixels and applies
   * dropScore. Ignored for the built-in kinds. MUST be a worklet — it runs on
   * the pipeline's worklet thread.
   */
  readonly extractBoxes?: (outputs: readonly Tensor[], s: number) => Quad[];
  /**
   * Recognizer input normalization, applied after the warp as `x·alpha + beta`
   * (scalar, or per-RGB-channel `[r,g,b]`). Defaults to `(x/255 − 0.5)/0.5` →
   * `[−1,1]` (`alpha = 1/127.5`, `beta = −1`), the SVTR/CRNN convention. Override
   * for a recognizer trained with different normalization (e.g. ImageNet).
   */
  readonly recognizerNorm?: {
    readonly alpha: number | readonly number[];
    readonly beta: number | readonly number[];
  };
  /** Fill value for the recognizer canvas padding. Defaults to 128 (neutral gray). */
  readonly recognizerPadValue?: number;
  /**
   * Custom recognizer decode, replacing the built-in greedy CTC. Receives the
   * raw `recognize_<W>` output tensor (shape `[1, T, V]`, softmaxed per the
   * contract) and the charset, and returns the recognized text plus a confidence
   * in `[0,1]`. Use for non-CTC heads (attention/AR decoders) or custom scoring.
   * MUST be a worklet — it runs on the pipeline's worklet thread.
   */
  readonly decode?: (
    logits: Tensor,
    charset: readonly string[]
  ) => { readonly text: string; readonly confidence: number };
};

/**
 * Per-run OCR options (passed to `runOCR`, not baked into the model — toggling
 * them needs no reload).
 * @category Types
 */
export type RunOCROptions = {
  /**
   * Add handling for upright stacked columns (e.g. vertical signage, shipping-
   * container codes — letters stacked top-to-bottom) on top of the normal
   * horizontal read. X-aligned stacked glyph boxes are joined into one column
   * word; a single tall box is cropped and its glyphs re-detected. Horizontal
   * lines still read normally, so this only ADDS capability (at extra compute).
   */
  readonly vertical?: boolean;
  /** Height/width ratio above which a box is treated as a stacked column. Default 1.5. */
  readonly tallCropRatio?: number;
  /** Max stacked-column re-detection passes per page (each is detector-scale). Default 8. */
  readonly maxRedetections?: number;
  /**
   * Free the model's bucket-method activation arenas (`detect_<S>`/`recognize_<W>`)
   * after this run, so memory doesn't accumulate as image/box sizes vary across
   * runs (worse on CoreML, which compiles a graph per method). Default `true`.
   * The document orchestrator passes `false` for its per-region OCR calls and
   * frees once per page via `releaseMethods` instead, so it keeps the run's
   * working set cached while still bounding memory.
   */
  readonly release?: boolean;
};

// Defaults for the shared baked contract — the detector input is raw RGB /255
// (mean/std baked into the PTE), the recognizer is RGB with (x/255−0.5)/0.5 norm
// and constant-128 left padding, both heads emit softmaxed probabilities, and
// confidence is the mean of per-character max-probs. CRAFT/DBNet decode the
// heatmap natively; everything else can be overridden per model via OCROptions
// (recognizerNorm/recognizerPadValue/decode, and 'custom' detectorKind+extractBoxes).
// Per-architecture default drop score:
const DEFAULT_DROP_SCORE: Record<'craft' | 'dbnet' | 'custom', number> = {
  craft: 0,
  dbnet: 0.5,
  custom: 0,
};

/**
 * Model configuration required to instantiate an OCR task runner. One fused PTE
 * exposing `detect` + `recognize`.
 * @category Types
 */
export type OCRModel = {
  readonly modelPath: string;
  readonly ocrOpts: OCROptions;
};

/**
 * A single recognized text region.
 * @category Types
 */
export type OCRDetection = {
  readonly text: string;
  readonly confidence: number;
  /**
   * The oriented quad (TL,TR,BR,BL) in original image pixels. Derive the
   * axis-aligned box with `boundingBoxOf(quad)` from `cv.ops.boxes` if needed.
   */
  readonly quad: readonly Point[];
  /** Wall-clock time spent recognizing this box (ms), incl. any retries. */
  readonly recognizeMs: number;
};

/**
 * The result of one OCR run: the recognized text regions.
 * @category Types
 */
export type OCRResult = {
  readonly detections: OCRDetection[];
};

// Default recognizer normalization / pad (SVTR/CRNN); overridable per model via
// OCROptions.recognizerNorm / recognizerPadValue.
const RECOGNIZER_ALPHA = 1 / 127.5; // (x/255 - 0.5)/0.5 -> [-1, 1]
const RECOGNIZER_BETA = -1;
const RECOGNIZER_PAD_VALUE = 128; // neutral gray
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
// A box taller than this ratio is read as an upright stacked column.
const TALL_CROP_RATIO = 1.5;
// Per-page cap on stacked-column re-detection passes (each is detector-scale).
const MAX_VERTICAL_REDETECTIONS = 8;
// Wider than this × its height = a horizontal line, never a vertical-column glyph.
const VERTICAL_GLYPH_ASPECT = 1.6;
// A box joins a column when its x-span overlaps the column's by this fraction and
// the y-gap is within this × its height (loose — signage letter spacing varies).
const VERTICAL_X_OVERLAP = 0.25;
const VERTICAL_Y_GAP = 2.5;
// Vertical reads are lower-confidence and opt-in, so they skip the drop-score gate.
const VERTICAL_DROP_SCORE = 0;

// cvtColor code to bring a source image format to RGB (both the detector and the
// recognizer operate on RGB), or null when it already is RGB.
function toRgbCode(format: ImageFormat): ColorConversionCode | null {
  'worklet';
  return FORMAT_CONVERSION[format].rgb;
}

// Stored at construction; CRAFT's `targetHeight` is per-run, so detectQuads adds it.
type DetectorExtractConfig = Omit<CraftExtractOptions, 'targetHeight'> | DbnetExtractOptions;

// Per-detect-bucket scratch tensors, allocated once at construction (like RecSet)
// and reused across the page pass and per-box re-detects. Only the source-resize
// tensor depends on the run's input channel count, so detectQuads allocates that
// one per call and reuses the rest from here.
type DetSet = {
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
type DetectContext = {
  readonly model: Model;
  readonly detBuckets: readonly number[];
  readonly format: ImageFormat;
  readonly numChannels: number;
  readonly detCode: ColorConversionCode | null;
  // Built-in decode config (craft/dbnet); undefined when a custom extractor is used.
  readonly extractOpts?: DetectorExtractConfig;
  // Custom TS box extractor for detectorKind 'custom'; takes precedence when set.
  readonly extractBoxes?: (outputs: readonly Tensor[], s: number) => Quad[];
  readonly detSets: ReadonlyMap<number, DetSet>;
};

// Detects text boxes in `src` (uint8 [H,W,numChannels], native `format`) and
// returns quads in `src` pixel space: letterbox into the snapped square bucket,
// run `detect_<S>`, extract quads. Scratch is the bucket's cached DetSet; only
// the source-resize tensor (input-channel-dependent) is allocated/freed here.
function detectQuads(
  ctx: DetectContext,
  src: Tensor,
  width: number,
  height: number,
  charLevel = false
): Point[][] {
  'worklet';
  const detS = snapDetectBucket(width, height, ctx.detBuckets);
  // snapDetectBucket always returns one of detBuckets, so the set exists.
  const ds = ctx.detSets.get(detS)!;
  // Only the source resize depends on the run's channel count; the rest is cached.
  const tDetResize = tensor('uint8', [detS, detS, ctx.numChannels]);
  try {
    src
      .through(resize, tDetResize, { mode: 'letterbox', interpolation: 'area', padValue: 0 })
      .throughIf(ctx.detCode !== null, cvtColor, ds.tColor, ctx.detCode!)
      .through(toChannelsFirst, ds.tCF)
      .through(normalize, ds.tNorm, { alpha: DETECTOR_ALPHA, beta: DETECTOR_BETA })
      .copyTo(ds.tInput);

    ctx.model.execute(`detect_${detS}`, [ds.tInput], [...ds.tOutputs]);
    // A custom arch hands its raw outputs to the user extractor; the built-ins
    // decode the heatmap (tOutputs[0]). CRAFT needs the per-run input height to
    // restore its half-res boxes; `charLevel` switches to per-glyph boxes.
    const quads = ctx.extractBoxes
      ? ctx.extractBoxes(ds.tOutputs, detS)
      : extractTextBoxes(
          ds.tOutputs[0]!,
          ctx.extractOpts!.mode === 'craft'
            ? { ...ctx.extractOpts!, targetHeight: detS, charLevel }
            : ctx.extractOpts!
        );
    return quads.map((q) => mapQuadToImage(q, detS, detS, width, height));
  } finally {
    tDetResize.dispose();
  }
}

// A recognizer width bucket's pre-allocated tensor-set (one per width in the
// model's `recognize` buckets).
type RecSet = {
  readonly width: number;
  readonly tCanvas: Tensor;
  readonly tCF: Tensor;
  readonly tNorm: Tensor;
  readonly tInput: Tensor;
  readonly tLogits: Tensor;
};

// Recognizer state for reading one quad. The source image is passed per call,
// so the same context reads both the full page and a per-box crop.
type RecContext = {
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

// Recognizes one ordered (TL,TR,BR,BL) quad from `src`: snap content width to a
// recognizer bucket, warp -> normalize -> execute -> greedy-CTC decode.
function recognizeQuad(
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
  const rs = ctx.recSetByWidth.get(bucketW)!;
  const contentWidth = Math.min(desiredW, bucketW);
  warpQuad(src, rs.tCanvas, flattenQuad(corners), {
    contentWidth,
    align: 'left',
    padMode: 'constant',
    padValue: ctx.padValue,
  });
  rs.tCanvas
    .through(toChannelsFirst, rs.tCF)
    .through(normalize, rs.tNorm, { alpha: ctx.normAlpha, beta: ctx.normBeta })
    .copyTo(rs.tInput);
  ctx.model.execute(`recognize_${bucketW}`, [rs.tInput], [rs.tLogits]);
  // A custom decode (e.g. attention/AR head) takes the raw logits; otherwise
  // greedy CTC. Both heads emit probabilities (CRNN softmax baked, SVTR pre-softmaxed).
  if (ctx.decode) {
    const r = ctx.decode(rs.tLogits, ctx.charset);
    return { text: r.text, conf: r.confidence };
  }
  const { indices, values } = ctcGreedyDecode(rs.tLogits, { softmax: false });
  const text = decodeGreedy(indices, ctx.charset);
  const conf = ctcConfidence(values, indices);
  return { text, conf };
}

// State the vertical-text path needs on top of `RecContext`: the detector (for
// the second, character-level pass) and the page tensors it crops the box from.
type VerticalContext = {
  readonly detCtx: DetectContext;
  readonly rawPage: Tensor; // full page, native format — cropped per box for re-detection
  readonly recCode: ColorConversionCode | null; // native format -> recognizer color
  readonly recC: number;
  readonly tallCropRatio: number; // height/width ratio above which a box is a column
  // Per-page budget for the (expensive) stacked-column re-detection pass.
  readonly redetectBudget: { remaining: number };
};

// Divides an ordered TL,TR,BR,BL box into `parts` equal vertical bands (each a
// TL,TR,BR,BL quad), top -> bottom. Used to recover the individual upright
// letters of a stacked column from a box the detector merged (DBNet emits one
// box per text region, not per glyph, so stacked letters arrive fused). `parts`
// <= 1 returns the box unchanged.
function splitTallQuad(ordered: readonly Point[], parts: number): Point[][] {
  'worklet';
  if (parts <= 1) {
    return [ordered as Point[]];
  }
  const [tl, tr, br, bl] = ordered as [Point, Point, Point, Point];
  const lerp = (a: Point, b: Point, t: number): Point => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  });
  const out: Point[][] = [];
  for (let i = 0; i < parts; i++) {
    const t0 = i / parts;
    const t1 = (i + 1) / parts;
    // Left edge runs tl->bl, right edge tr->br; take the band between t0 and t1.
    out.push([lerp(tl, bl, t0), lerp(tr, br, t0), lerp(tr, br, t1), lerp(tl, bl, t1)]);
  }
  return out;
}

// Joins glyph quads (in `src` pixel space, in reading order) into one recognizer
// strip — each glyph warped upright to the recognizer height and laid side by
// side — and recognizes it as a single line (joint hconcat). Returns null when
// nothing usable was assembled.
//
// Must be defined BEFORE its callers: the worklet plugin captures referenced
// worklets in source order, so a forward reference is undefined at run time.
function recognizeGlyphStrip(
  recCtx: RecContext,
  src: Tensor,
  recC: number,
  glyphs: readonly (readonly Point[])[]
): { text: string; conf: number } | null {
  'worklet';
  const recH = recCtx.recH;
  const maxRec = recCtx.recBuckets[recCtx.recBuckets.length - 1]!;
  // Warp each glyph upright to recognizer height (aspect preserved). A box that
  // is much taller than wide is a merged run of stacked letters — split it into
  // ~square single-letter cells first, so each lands in its own strip slot
  // (otherwise N letters get squashed into one cell and read as garbage).
  const slices: { tGlyph: Tensor; w: number }[] = [];
  let totalW = 0;
  for (const g of glyphs) {
    const gsz = quadSize(g);
    if (gsz.width < 1 || gsz.height < 1) {
      continue;
    }
    const parts = Math.max(1, Math.round(gsz.height / Math.max(1, gsz.width)));
    for (const cell of splitTallQuad(g, parts)) {
      const gs = quadSize(cell);
      if (gs.width < 1 || gs.height < 1) {
        continue;
      }
      const gw = Math.max(1, Math.min(Math.round((gs.width * recH) / gs.height), maxRec));
      const tGlyph = tensor('uint8', [recH, gw, recC]);
      warpQuad(src, tGlyph, flattenQuad(cell), {
        contentWidth: gw,
        align: 'left',
        padMode: 'constant',
        padValue: recCtx.padValue,
      });
      slices.push({ tGlyph, w: gw });
      totalW += gw;
    }
  }
  if (slices.length === 0) {
    return null;
  }
  try {
    // Smallest bucket that fits the strip (snap up, no glyph truncated); widest
    // bucket for very long columns.
    const bucketW =
      recCtx.recBuckets.find((w) => w >= totalW) ??
      recCtx.recBuckets[recCtx.recBuckets.length - 1]!;
    const rs = recCtx.recSetByWidth.get(bucketW)!;
    // Assemble the strip row-major into the bucket canvas, neutral-padded.
    const strip = new Uint8Array(recH * bucketW * recC);
    strip.fill(recCtx.padValue);
    let xOff = 0;
    for (const s of slices) {
      if (xOff >= bucketW) {
        break;
      }
      const copyW = Math.min(s.w, bucketW - xOff);
      const glyphBytes = new Uint8Array(recH * s.w * recC);
      s.tGlyph.getData(glyphBytes);
      for (let oy = 0; oy < recH; oy++) {
        const srcStart = oy * s.w * recC;
        const row = glyphBytes.subarray(srcStart, srcStart + copyW * recC);
        strip.set(row, (oy * bucketW + xOff) * recC);
      }
      xOff += s.w;
    }
    rs.tCanvas.setData(strip);
    rs.tCanvas
      .through(toChannelsFirst, rs.tCF)
      .through(normalize, rs.tNorm, { alpha: recCtx.normAlpha, beta: recCtx.normBeta })
      .copyTo(rs.tInput);
    recCtx.model.execute(`recognize_${bucketW}`, [rs.tInput], [rs.tLogits]);
    if (recCtx.decode) {
      const r = recCtx.decode(rs.tLogits, recCtx.charset);
      return r.text.length > 0 ? { text: r.text, conf: r.confidence } : null;
    }
    const { indices, values } = ctcGreedyDecode(rs.tLogits, { softmax: false });
    const text = decodeGreedy(indices, recCtx.charset);
    const conf = ctcConfidence(values, indices);
    return text.length > 0 ? { text, conf } : null;
  } finally {
    slices.forEach((s) => s.tGlyph.dispose());
  }
}

// Reads a single tall box that packs several stacked glyphs the detector grouped
// into one box (e.g. a tightly-set container code): crop it upright, re-detect
// the glyphs (char-level pass), and read them top -> bottom as a joined strip.
// Returns null — caller falls back to a horizontal read — when the box is tiny,
// the per-page re-detect budget is spent, or nothing is found.
function readStackedColumn(
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
    return recognizeGlyphStrip(recCtx, boxSrc, recC, glyphs);
  } finally {
    tBoxRaw.dispose();
    tRecBox.dispose();
  }
}

// Bounding axis-aligned quad (TL,TR,BR,BL) enclosing a set of quads.
function boundingQuadOf(quads: readonly (readonly Point[])[]): Point[] {
  'worklet';
  if (quads.length === 0) {
    return [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ];
  }
  let xmin = Infinity;
  let ymin = Infinity;
  let xmax = -Infinity;
  let ymax = -Infinity;
  for (const q of quads) {
    for (const p of q) {
      xmin = Math.min(xmin, p.x);
      ymin = Math.min(ymin, p.y);
      xmax = Math.max(xmax, p.x);
      ymax = Math.max(ymax, p.y);
    }
  }
  return [
    { x: xmin, y: ymin },
    { x: xmax, y: ymin },
    { x: xmax, y: ymax },
    { x: xmin, y: ymax },
  ];
}

// Reorders recognized detections into human reading order (the detector emits
// boxes in an arbitrary order). Column-aware: genuine multi-column pages read
// column-by-column, single-column pages line-by-line, words within a line
// left-to-right. Defined before its caller so the worklet plugin captures it.
function orderDetections(dets: OCRDetection[]): OCRDetection[] {
  'worklet';
  if (dets.length <= 1) {
    return dets;
  }
  const order = readingOrderIndices(dets.map((d) => d.quad));
  return order.map((i) => dets[i]!);
}

// Clusters glyph-like, x-aligned, stacked boxes into vertical columns; wide lines
// and isolated boxes come back as `singles` to read normally. So `vertical` ADDS
// column reading without disturbing horizontal reads.
function groupVerticalColumns(quads: readonly (readonly Point[])[]): {
  columns: Point[][][];
  singles: Point[][];
} {
  'worklet';
  type B = {
    q: Point[];
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
    w: number;
    h: number;
  };
  const candidates: B[] = [];
  const singles: Point[][] = [];
  for (const q of quads) {
    let xmin = Infinity;
    let ymin = Infinity;
    let xmax = -Infinity;
    let ymax = -Infinity;
    for (const p of q) {
      xmin = Math.min(xmin, p.x);
      ymin = Math.min(ymin, p.y);
      xmax = Math.max(xmax, p.x);
      ymax = Math.max(ymax, p.y);
    }
    const w = xmax - xmin;
    const h = ymax - ymin;
    if (w > h * VERTICAL_GLYPH_ASPECT) {
      singles.push(q as Point[]); // a horizontal line — read normally
    } else {
      candidates.push({ q: q as Point[], xmin, xmax, ymin, ymax, w, h });
    }
  }
  // Top -> bottom, growing each column from its current bottom box. Alignment is
  // checked against the column's accumulated x-range (not just the last box), so a
  // narrow glyph like `I` between wider ones doesn't break the run.
  candidates.sort((a, b) => a.ymin - b.ymin);
  type Col = { boxes: B[]; xmin: number; xmax: number; bottom: number };
  const cols: Col[] = [];
  for (const b of candidates) {
    let placed = false;
    for (const col of cols) {
      const overlap = Math.min(b.xmax, col.xmax) - Math.max(b.xmin, col.xmin);
      const aligned = overlap > VERTICAL_X_OVERLAP * Math.min(b.w, col.xmax - col.xmin);
      const gap = b.ymin - col.bottom;
      if (aligned && gap < VERTICAL_Y_GAP * b.h && gap > -0.5 * b.h) {
        col.boxes.push(b);
        col.xmin = Math.min(col.xmin, b.xmin);
        col.xmax = Math.max(col.xmax, b.xmax);
        col.bottom = b.ymax;
        placed = true;
        break;
      }
    }
    if (!placed) {
      cols.push({ boxes: [b], xmin: b.xmin, xmax: b.xmax, bottom: b.ymax });
    }
  }
  const columns: Point[][][] = [];
  for (const col of cols) {
    if (col.boxes.length >= 2) {
      columns.push(col.boxes.map((b) => b.q)); // already top -> bottom
    } else {
      singles.push(col.boxes[0]!.q);
    }
  }
  return { columns, singles };
}

// Reads one box that may be an upright stacked column (e.g. a shipping-container
// code, letters stacked top-to-bottom). A normal-aspect box is read horizontally;
// a tall box is read as a stacked column, falling back to the horizontal read.
// `stacked` reports whether the column path produced the read (caller applies the
// lenient vertical drop-score to those).
function readBoxVertical(
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

// Pre-allocates one detector scratch-set per detect bucket (channel-independent
// tensors; the per-run source-resize tensor is allocated in detectQuads). Mirrors
// buildRecognizerSets — runs at construction.
function buildDetectorSets(
  model: Model,
  detBuckets: readonly number[],
  detectorKind: 'craft' | 'dbnet' | 'custom',
  detExtraChannels: readonly number[]
): DetSet[] {
  return detBuckets.map((s) => {
    const heat = s / 2;
    // Custom archs declare arbitrary outputs — size them straight from the PTE's
    // method metadata. Built-ins keep their known heatmap (+ craft extras) shapes.
    let tOutputs: Tensor[];
    if (detectorKind === 'custom') {
      tOutputs = model
        .getMethodMeta(`detect_${s}`)
        .outputTensorMeta.map((m) => tensor(m.dtype, m.shape));
    } else {
      const tHeatmap =
        detectorKind === 'dbnet'
          ? tensor('float32', [1, 1, s, s])
          : tensor('float32', [1, heat, heat, 2]);
      tOutputs = [tHeatmap, ...detExtraChannels.map((c) => tensor('float32', [1, c, heat, heat]))];
    }
    return {
      s,
      tColor: tensor('uint8', [s, s, 3]),
      tCF: tensor('uint8', [3, s, s]),
      tNorm: tensor('float32', [3, s, s]),
      tInput: tensor('float32', [1, 3, s, s]),
      tOutputs,
    };
  });
}

// Pre-allocates one recognizer tensor-set per width bucket (each `recognize_<W>`
// validated once) and derives the constant channel/height/vocab contract from the
// first bucket. Kept out of the task factory; runs at construction.
function buildRecognizerSets(
  model: Model,
  recBuckets: readonly number[]
): { sets: RecSet[]; recC: number; recH: number; vocabSize: number } {
  let recC = 0;
  let recH = 0;
  let vocabSize = 0;
  const sets = recBuckets.map((w, i) => {
    const m = validateModelSchema(
      model,
      `recognize_${w}`,
      [SymbolicTensor('float32', [1, 'C', 'H', 'W'])],
      [SymbolicTensor('float32', [1, 'T', 'V'])]
    );
    const inShape = m.inputTensorMeta[0]!.shape;
    if (i === 0) {
      // Channels/height/vocab are constant across the width buckets.
      recC = inShape[1]!;
      recH = inShape[2]!;
      vocabSize = m.outputTensorMeta[0]!.shape[2]!;
    }
    return {
      width: w,
      tCanvas: tensor('uint8', [recH, w, recC]),
      tCF: tensor('uint8', [recC, recH, w]),
      tNorm: tensor('float32', [recC, recH, w]),
      tInput: tensor('float32', inShape),
      tLogits: tensor('float32', m.outputTensorMeta[0]!.shape),
    };
  });
  return { sets, recC, recH, vocabSize };
}

/**
 * Creates a unified OCR runner for two-stage detect -> recognize models
 * (EasyOCR / PaddleOCR). It loads one fused PTE, validates the `detect` and
 * `recognize` methods, pre-allocates static scratch tensors sized from the
 * model's compiled shapes, and returns recognition + disposal controls.
 * @category Typescript API
 * @param config OCR task configuration containing the model path and flat
 * options.
 * @param runtime Optional worklet runtime thread on which to run the pipeline.
 * @returns A promise resolving to an object with recognition and disposal
 * controls.
 */
export async function createOCR(
  config: OCRModel,
  runtime?: WorkletRuntime
): Promise<{
  dispose: () => void;
  runOCR: (input: ImageBuffer, options?: RunOCROptions) => Promise<OCRResult>;
  runOCRWorklet: (input: ImageBuffer, options?: RunOCROptions) => OCRResult;
  /** Free all bucket-method arenas without disposing the model (see `RunOCROptions.release`). */
  releaseMethods: () => Promise<void>;
  /** Worklet-thread variant of {@link releaseMethods}. */
  releaseMethodsWorklet: () => void;
}> {
  const { modelPath, ocrOpts } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  const dropScore = ocrOpts.dropScore ?? DEFAULT_DROP_SCORE[ocrOpts.detectorKind];
  // Recognizer normalization / pad / decode — defaults preserve the SVTR/CRNN
  // contract; OCROptions can override per model (see RecContext).
  const recNormAlpha = ocrOpts.recognizerNorm?.alpha ?? RECOGNIZER_ALPHA;
  const recNormBeta = ocrOpts.recognizerNorm?.beta ?? RECOGNIZER_BETA;
  const recPadValue = ocrOpts.recognizerPadValue ?? RECOGNIZER_PAD_VALUE;
  const recDecode = ocrOpts.decode;

  const detBuckets = ocrOpts.buckets.detect;
  const recBuckets = ocrOpts.buckets.recognize;
  // Validation + scratch allocation can throw (bad buckets, missing methods,
  // shape/charset mismatch); on any failure dispose the model and any tensors
  // already built, so a bad config doesn't leak native memory.
  let recSets: RecSet[] = [];
  let recC = 3;
  let recH = 0;
  let charset: string[] = [];
  let recSetByWidth: ReadonlyMap<number, RecSet> = new Map();
  let detExtraChannels: number[] = [];
  let detSets: DetSet[] = [];
  let detSetByS: ReadonlyMap<number, DetSet> = new Map();
  const disposeDetSets = () =>
    detSets.forEach((d) => {
      d.tColor.dispose();
      d.tCF.dispose();
      d.tNorm.dispose();
      d.tInput.dispose();
      d.tOutputs.forEach((t) => t.dispose());
    });
  try {
    if (detBuckets.length === 0 || recBuckets.length === 0) {
      throw new Error(
        'OCR: buckets.detect and buckets.recognize must each list at least one size.'
      );
    }
    // CRAFT's half-resolution heatmap needs even detect-bucket sides.
    if (ocrOpts.detectorKind === 'craft' && detBuckets.some((s) => s % 2 !== 0)) {
      throw new Error(
        'OCR: every CRAFT detect bucket side must be even (half-resolution heatmap).'
      );
    }
    const detInSpec = [SymbolicTensor('float32', [1, 3, 'H', 'W'])];
    if (ocrOpts.detectorKind === 'custom') {
      if (!ocrOpts.extractBoxes) {
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
    } else {
      // Validate every detect bucket against the architecture's output spec; keep
      // the largest bucket's meta for the constant CRAFT extra-output channels.
      const detOutSpec =
        ocrOpts.detectorKind === 'dbnet'
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
      detExtraChannels = detMeta.outputTensorMeta.slice(1).map((t) => t.shape[1]!);
    }

    const built = buildRecognizerSets(model, recBuckets);
    recSets = built.sets;
    recC = built.recC;
    recH = built.recH;
    recSetByWidth = new Map(recSets.map((s) => [s.width, s]));

    if (recC !== 3) {
      throw new Error(`OCR: recognizer must take RGB (3 channels), but the model expects ${recC}.`);
    }
    charset = buildCharset(ocrOpts.charset);
    if (charset.length !== built.vocabSize) {
      throw new Error(
        `OCR: charset size (${charset.length}, incl. blank) must match recognizer output vocab (${built.vocabSize}).`
      );
    }
    detSets = buildDetectorSets(model, detBuckets, ocrOpts.detectorKind, detExtraChannels);
    detSetByS = new Map(detSets.map((d) => [d.s, d]));
  } catch (e) {
    recSets.forEach((s) => {
      s.tCanvas.dispose();
      s.tCF.dispose();
      s.tNorm.dispose();
      s.tInput.dispose();
      s.tLogits.dispose();
    });
    disposeDetSets();
    model.dispose();
    throw e;
  }

  // Built-in box-decode config (custom archs decode in TS via extractBoxes instead).
  const extractOpts: DetectorExtractConfig | undefined =
    ocrOpts.detectorKind === 'custom'
      ? undefined
      : ocrOpts.detectorKind === 'dbnet'
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

  const dispose = () => {
    recSets.forEach((s) => {
      s.tCanvas.dispose();
      s.tCF.dispose();
      s.tNorm.dispose();
      s.tInput.dispose();
      s.tLogits.dispose();
    });
    disposeDetSets();
    model.dispose();
  };

  // Free every per-size method's activation arena (detect_<S>/recognize_<W>)
  // without disposing the model — they transparently reload on next execute.
  // Defined before runOCRWorklet so the worklet plugin captures it (referenced
  // worklets must precede their callers in source order).
  const releaseMethodsWorklet = () => {
    'worklet';
    for (const s of detBuckets) {
      model.unloadMethod(`detect_${s}`);
    }
    for (const w of recBuckets) {
      model.unloadMethod(`recognize_${w}`);
    }
  };

  const runOCRWorklet = (input: ImageBuffer, options?: RunOCROptions): OCRResult => {
    'worklet';
    const vertical = options?.vertical ?? false;
    const tallCropRatio = options?.tallCropRatio ?? TALL_CROP_RATIO;
    const maxRedetections = options?.maxRedetections ?? MAX_VERTICAL_REDETECTIONS;
    const release = options?.release ?? true;
    const { data, width, height, format } = input;
    const numChannels = FORMAT_CHANNELS[format];
    // Both detector and recognizer read RGB, so one conversion code serves both.
    const rgbCode = toRgbCode(format);

    // Detector state, reused for the page pass and the per-box character pass.
    const detCtx: DetectContext = {
      model,
      detBuckets,
      format,
      numChannels,
      detCode: rgbCode,
      extractOpts,
      extractBoxes: ocrOpts.extractBoxes,
      detSets: detSetByS,
    };

    const tInputRaw = tensor('uint8', [height, width, numChannels]);
    const tRecImage = tensor('uint8', [height, width, recC]);
    try {
      tInputRaw.setData(data);

      // ---- detector pass: letterbox -> detect_<S> -> text-box quads (image space) ----
      const quads = detectQuads(detCtx, tInputRaw, width, height);
      if (quads.length === 0) {
        return { detections: [] };
      }

      // ---- recognizer source: full-res image in RGB ----
      const recSrc = rgbCode !== null ? cvtColor(tInputRaw, tRecImage, rgbCode) : tInputRaw;
      const recCtx: RecContext = {
        model,
        recSetByWidth,
        recBuckets,
        recH,
        charset,
        normAlpha: recNormAlpha,
        normBeta: recNormBeta,
        padValue: recPadValue,
        decode: recDecode,
      };
      // The vertical path crops each box from the raw page and re-detects its
      // characters; `recCode`/`recC` convert a box crop to RGB.
      const vctx: VerticalContext = {
        detCtx,
        rawPage: tInputRaw,
        recCode: rgbCode,
        recC,
        tallCropRatio,
        redetectBudget: { remaining: maxRedetections },
      };

      const detections: OCRDetection[] = [];
      const pushAt =
        (threshold: number) => (text: string, conf: number, quad: readonly Point[], ms: number) => {
          if (text.length > 0 && conf >= threshold) {
            detections.push({ text, confidence: conf, quad, recognizeMs: ms });
          }
        };
      const push = pushAt(dropScore); // flat lines: normal drop-score
      const pushVertical = pushAt(VERTICAL_DROP_SCORE); // stacked/column: lenient

      // Valid (non-tiny) boxes, ordered TL,TR,BR,BL.
      const ordered: Point[][] = [];
      for (const quad of quads) {
        const o = orderQuad(quad);
        const s = quadSize(o);
        if (s.width >= 3 && s.height >= 3) {
          ordered.push(o);
        }
      }

      if (!vertical) {
        for (const o of ordered) {
          const boxStart = nowMs();
          const { text, conf } = recognizeQuad(recCtx, recSrc, o);
          push(text, conf, o, nowMs() - boxStart);
        }
        return { detections: orderDetections(detections) };
      }

      // Additive vertical pass: read x-aligned stacked glyph boxes as one joined
      // column word; everything else (lines, isolated boxes) reads normally.
      const { columns, singles } = groupVerticalColumns(ordered);
      for (const col of columns) {
        const boxStart = nowMs();
        // `recognizeGlyphStrip` splits any multi-letter box into single-glyph
        // cells (DBNet merges stacked letters and won't split them), so the
        // column's boxes can be passed straight through, top -> bottom.
        const r = recognizeGlyphStrip(recCtx, recSrc, recC, col);
        if (r) {
          pushVertical(r.text, r.conf, boundingQuadOf(col), nowMs() - boxStart);
        }
      }
      for (const o of singles) {
        const boxStart = nowMs();
        const { text, conf, stacked } = readBoxVertical(recCtx, vctx, recSrc, o, quadSize(o));
        (stacked ? pushVertical : push)(text, conf, o, nowMs() - boxStart);
      }
      return { detections: orderDetections(detections) };
    } finally {
      tInputRaw.dispose();
      tRecImage.dispose();
      // Standalone runs free their bucket arenas so memory stays bounded as
      // sizes vary; the document orchestrator opts out (release: false) and
      // frees once per page.
      if (release) {
        releaseMethodsWorklet();
      }
    }
  };

  const runOCR = wrapAsync(runOCRWorklet, runtime);
  const releaseMethods = wrapAsync(releaseMethodsWorklet, runtime);

  return { runOCR, runOCRWorklet, dispose, releaseMethods, releaseMethodsWorklet };
}
