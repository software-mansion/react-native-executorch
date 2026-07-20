// OCR detect → recognize engine, internal to the OCR task. Worklet source order
// matters: a referenced worklet must be defined above its callers.

import { rnexecutorchJsi } from '../../../../native/bridge';
import { tensor, type Tensor } from '../../../../core/tensor';
import { validateModelSchema, SymbolicTensor } from '../../../../core/modelSchema';
import type { Model, DimRange, InputShapeConstraint } from '../../../../core/model';

import type { ImageBuffer, ImageFormat } from '../../image';
import {
  resize,
  cvtColor,
  rectifyQuad,
  toChannelsFirst,
  normalize,
  FORMAT_CHANNELS,
  FORMAT_CONVERSION,
  type NormalizeOptions,
} from '../../ops/image';
import {
  boundingQuadOf,
  mapQuadToImage,
  orderQuad,
  quadSize,
  splitTallQuad,
  splitWideQuad,
  type Quad,
} from '../../ops/quad';
import type { TextBoxExtractor } from './detectors';
import { orderByReadingOrder, groupVerticalStacks } from './geometry';

/**
 * A single recognized text region. `quad` is the oriented (TL,TR,BR,BL) box in
 * original image pixels (axis-aligned bounds via `boundsOfPoints(quad,'xyxy')`).
 * @category Types
 */
export type OcrDetection = {
  readonly text: string;
  readonly confidence: number;
  readonly quad: Quad;
};

// ─── Input size resolution ───────────────────────────────────────────────────

// A target this fraction above a smaller legal size snaps DOWN to it, so a
// marginal overflow doesn't force the next much-larger enumerated shape.
const SNAP_DOWN_TOLERANCE = 0.1;

// Snap a size UP to the smallest legal `min + k*step` (clamped to max); never
// shrinks content, only the range max can.
function snapUpDim(size: number, range: DimRange): number {
  'worklet';
  const steps = Math.ceil(Math.max(0, size - range.min) / Math.max(1, range.step));
  return Math.min(range.min + steps * Math.max(1, range.step), range.max);
}

// Largest legal detector input size (NCHW, dim 2 = H, dim 3 = W) that avoids
// upscaling: dynamic ranges snap H/W independently; an enumerated set picks the
// best-scale shape; a static shape is used as-is.
function resolveDetectorSize(
  constraint: InputShapeConstraint,
  imgWidth: number,
  imgHeight: number
): { detW: number; detH: number } {
  'worklet';
  if ('dims' in constraint) {
    const hRange = constraint.dims[2]!;
    const wRange = constraint.dims[3]!;
    const scale = Math.min(1, hRange.max / imgHeight, wRange.max / imgWidth);
    return {
      detW: snapUpDim(Math.round(imgWidth * scale), wRange),
      detH: snapUpDim(Math.round(imgHeight * scale), hRange),
    };
  }
  if ('shape' in constraint) {
    return { detW: constraint.shape[3]!, detH: constraint.shape[2]! };
  }
  // Among enumerated shapes whose downscale is within tolerance prefer the
  // smallest area (fastest); otherwise take the least downscale (most detail).
  let best: readonly number[] | null = null;
  let bestScale = -Infinity;
  let bestArea = Infinity;
  for (const shape of constraint.shapes) {
    const scale = Math.min(shape[2]! / imgHeight, shape[3]! / imgWidth);
    const area = shape[2]! * shape[3]!;
    const withinTolerance = scale >= 1 / (1 + SNAP_DOWN_TOLERANCE);
    const bestWithinTolerance = bestScale >= 1 / (1 + SNAP_DOWN_TOLERANCE);
    const better = withinTolerance
      ? !bestWithinTolerance || area < bestArea
      : !bestWithinTolerance && scale > bestScale;
    if (better) {
      best = shape;
      bestScale = scale;
      bestArea = area;
    }
  }
  return { detW: best![3]!, detH: best![2]! };
}

// Recognizer input width (NCHW dim 3): smallest legal width ≥ desired content, so
// snapping never squishes (only the constraint max can).
function resolveRecWidth(constraint: InputShapeConstraint, desiredWidth: number): number {
  'worklet';
  if ('dims' in constraint) {
    return snapUpDim(desiredWidth, constraint.dims[3]!);
  }
  if ('shape' in constraint) {
    return constraint.shape[3]!;
  }
  // Smallest enumerated width that fits the desired content, else the largest.
  const widths = constraint.shapes.map((s) => s[3]!).sort((a, b) => a - b);
  return widths.find((w) => w >= desiredWidth) ?? widths[widths.length - 1]!;
}

// ─── CTC decode ──────────────────────────────────────────────────────────────

// Greedy-CTC decode of `[..,T,V]` probs: a native op returns per-timestep
// [idx, value, ...]; drop blank (idx 0) + consecutive repeats, mean-conf the rest.
function greedyCtcDecode(
  probs: Tensor,
  charset: readonly string[]
): { text: string; conf: number } {
  'worklet';
  const flat = rnexecutorchJsi.cv.ctcGreedyDecode(probs) as number[];
  let text = '';
  let last = -1;
  let probabilitySum = 0;
  let charCounter = 0;
  for (let i = 0; i < flat.length; i += 2) {
    const idx = flat[i]!;
    if (idx >= 1) {
      probabilitySum += flat[i + 1]!;
      charCounter++;
      if (idx !== last && idx < charset.length) {
        text += charset[idx]!;
      }
    }
    last = idx;
  }
  return { text, conf: charCounter === 0 ? 0 : probabilitySum / charCounter };
}

// ─── Execution ───────────────────────────────────────────────────────────────

// A line at most this factor wider than the recognizer max is squished into it;
// anything wider is split and read piecewise (a hard clamp is unreadable).
const WIDE_SQUISH_TOLERANCE = 1.15;

// Boxes smaller than this (px, either side) aren't worth recognizing.
const MIN_BOX_SIDE = 3;

// The recognizer input is contractually RGB (enforced by resolveOcrContract).
const REC_CHANNELS = 3;

// Detects text boxes in `src`, returning quads in `src` pixel space. `charLevel`
// requests per-glyph boxes for the stacked-text pass.
function detectQuads(
  engine: OcrEngine,
  src: Tensor,
  width: number,
  height: number,
  format: ImageFormat,
  charLevel = false
): Quad[] {
  'worklet';
  const numChannels = FORMAT_CHANNELS[format];
  const toRgbCode = FORMAT_CONVERSION[format].rgb;
  const { detW, detH } = resolveDetectorSize(engine.det.constraint, width, height);
  // Resolve output shapes before allocating — the extractor may throw (CRAFT on
  // odd dims), and nothing must leak on that path.
  const outputShapes = engine.extractBoxes.outputShapes({ width: detW, height: detH });
  const tResize = tensor('uint8', [detH, detW, numChannels]);
  const tColor = toRgbCode !== null ? tensor('uint8', [detH, detW, 3]) : null;
  const tCF = tensor('uint8', [3, detH, detW]);
  const tNorm = tensor('float32', [3, detH, detW]);
  const tInput = tensor('float32', [1, 3, detH, detW]);
  const tOutputs = outputShapes.map((shape) => tensor('float32', shape));
  try {
    src
      .through(resize, tResize, { mode: 'letterbox', interpolation: 'area', padValue: 0 })
      .throughIf(tColor !== null, cvtColor, tColor!, toRgbCode!)
      .through(toChannelsFirst, tCF)
      .through(normalize, tNorm, engine.det.norm)
      .copyTo(tInput);

    engine.model.execute('detect', [tInput], tOutputs);
    const quads = engine.extractBoxes.extract(tOutputs, { width: detW, height: detH }, charLevel);
    return quads.map((q) => mapQuadToImage(q, detW, detH, width, height));
  } finally {
    tResize.dispose();
    tColor?.dispose();
    tCF.dispose();
    tNorm.dispose();
    tInput.dispose();
    for (const tOut of tOutputs) {
      tOut.dispose();
    }
  }
}

// Recognizes a canvas already sized to a legal recognizer width — custom
// `decode` if provided, else greedy CTC.
function recognizeCanvas(
  engine: OcrEngine,
  tCanvas: Tensor,
  snappedW: number
): { text: string; conf: number } {
  'worklet';
  const { recH, outStride, vocab, norm } = engine.rec;
  const tCF = tensor('uint8', [REC_CHANNELS, recH, snappedW]);
  const tNorm = tensor('float32', [REC_CHANNELS, recH, snappedW]);
  const tInput = tensor('float32', [1, REC_CHANNELS, recH, snappedW]);
  // CTC timesteps scale with the input width by the recognizer's downsample
  // stride, so the dynamically-sized probs output can be pre-allocated.
  const timesteps = Math.round(snappedW / outStride);
  const tProbs = tensor('float32', [1, timesteps, vocab]);
  try {
    tCanvas.through(toChannelsFirst, tCF).through(normalize, tNorm, norm).copyTo(tInput);
    engine.model.execute('recognize', [tInput], [tProbs]);
    if (engine.decode) {
      const r = engine.decode(tProbs, engine.charset);
      return { text: r.text, conf: r.confidence };
    }
    return greedyCtcDecode(tProbs, engine.charset);
  } finally {
    tCF.dispose();
    tNorm.dispose();
    tInput.dispose();
    tProbs.dispose();
  }
}

// Recognizes one quad that fits the recognizer width (a mild squish is fine);
// wider lines go through recognizeQuad instead.
function recognizeNarrowQuad(
  engine: OcrEngine,
  src: Tensor,
  quad: Quad
): { text: string; conf: number } {
  'worklet';
  const { recH, maxW, widthConstraint, padValue, padMode } = engine.rec;
  const size = quadSize(quad);
  // Aspect-preserving width of the content at recognizer height (>= 1 px).
  const aspectWidth = Math.max(1, Math.round((recH * size.width) / Math.max(1, size.height)));
  const contentW = Math.min(aspectWidth, maxW);
  const snappedW = resolveRecWidth(widthConstraint, contentW);
  const tCanvas = tensor('uint8', [recH, snappedW, REC_CHANNELS]);
  try {
    rectifyQuad(src, tCanvas, quad, {
      contentWidth: contentW,
      align: 'left',
      padMode,
      padValue,
    });
    return recognizeCanvas(engine, tCanvas, snappedW);
  } finally {
    tCanvas.dispose();
  }
}

// Recognizes one ordered (TL,TR,BR,BL) quad. A line wider than the tolerance is
// split into segments read piecewise; confidence is the length-weighted mean.
function recognizeQuad(engine: OcrEngine, src: Tensor, quad: Quad): { text: string; conf: number } {
  'worklet';
  const { recH, maxW } = engine.rec;
  const size = quadSize(quad);

  const desiredW = Math.max(1, Math.round((recH * size.width) / Math.max(1, size.height)));
  if (desiredW <= maxW * WIDE_SQUISH_TOLERANCE) {
    return recognizeNarrowQuad(engine, src, quad);
  }
  const segments = splitWideQuad(quad, Math.ceil(desiredW / maxW));
  let text = '';
  let weightedConf = 0;
  let weight = 0;
  for (const segment of segments) {
    const r = recognizeNarrowQuad(engine, src, segment);
    if (r.text.length > 0) {
      text += r.text;
      weightedConf += r.conf * r.text.length;
      weight += r.text.length;
    }
  }
  return { text, conf: weight === 0 ? 0 : weightedConf / weight };
}

// Reads a vertical stack of glyph quads top-to-bottom: each glyph is recognized
// on its OWN and the single-char results joined. Composing the glyphs into one
// horizontal strip makes the recognizer hallucinate a word out of a non-word
// column (its context was trained on horizontal words); reading them
// individually drops that bias. A box the detector merged from several stacked
// letters is first split into ~square cells. Confidence is the length-weighted
// mean; null when nothing usable.
function recognizeGlyphStrip(
  engine: OcrEngine,
  src: Tensor,
  glyphs: readonly Quad[]
): { text: string; conf: number } | null {
  'worklet';
  let text = '';
  let weightedConf = 0;
  let weight = 0;
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
      const r = recognizeNarrowQuad(engine, src, cell);
      if (r.text.length > 0) {
        text += r.text;
        weightedConf += r.conf * r.text.length;
        weight += r.text.length;
      }
    }
  }
  return weight === 0 ? null : { text, conf: weightedConf / weight };
}

// Reads one tall box the detector merged from stacked glyphs: crop upright,
// re-detect the glyphs (char-level), recognize top-to-bottom. Null (caller reads
// it horizontally) when too small, out of re-detect budget, or no glyphs found.
function readStackedBox(
  engine: OcrEngine,
  page: Tensor,
  format: ImageFormat,
  ordered: Quad,
  size: { width: number; height: number },
  budget: { remaining: number }
): { text: string; conf: number } | null {
  'worklet';
  const boxW = Math.round(size.width);
  const boxH = Math.round(size.height);
  if (boxW < MIN_BOX_SIDE || boxH < MIN_BOX_SIDE || budget.remaining <= 0) {
    return null;
  }
  budget.remaining--;
  const numChannels = FORMAT_CHANNELS[format];
  const toRgbCode = FORMAT_CONVERSION[format].rgb;
  const tBoxRaw = tensor('uint8', [boxH, boxW, numChannels]);
  let tRecBox: Tensor | null = null;
  try {
    rectifyQuad(page, tBoxRaw, ordered, {
      contentWidth: boxW,
      align: 'left',
      padMode: 'constant',
      padValue: 0,
    });
    const charQuads = detectQuads(engine, tBoxRaw, boxW, boxH, format, /* charLevel */ true);
    if (charQuads.length === 0) {
      return null;
    }
    let boxSrc = tBoxRaw;
    if (toRgbCode !== null) {
      tRecBox = tensor('uint8', [boxH, boxW, REC_CHANNELS]);
      boxSrc = cvtColor(tBoxRaw, tRecBox, toRgbCode);
    }
    const glyphs = charQuads.map((q) => orderQuad(q)).sort((a, b) => a[0]!.y - b[0]!.y);
    return recognizeGlyphStrip(engine, boxSrc, glyphs);
  } finally {
    tBoxRaw.dispose();
    tRecBox?.dispose();
  }
}

// ─── OCR pass ────────────────────────────────────────────────────────────────

const TALL_CROP_RATIO = 1.5;
const MAX_VERTICAL_REDETECTIONS = 8;
// Vertical reads are lower-confidence than horizontal, so they default to no gate
// (show everything); a per-run `verticalMinConfidence` raises it to filter junk.
const DEFAULT_VERTICAL_MIN_CONFIDENCE = 0;

/**
 * The resolved, model-level state one detect → recognize pass needs — the model
 * itself, the validated detect/recognize contract, the CTC charset, and the run
 * options. Built once by `createOcr`, reused across every page and per-region call.
 */
export type OcrEngine = {
  readonly model: Model;
  readonly extractBoxes: TextBoxExtractor;
  readonly det: {
    readonly constraint: InputShapeConstraint;
    readonly norm: NormalizeOptions;
  };
  readonly rec: {
    readonly recH: number;
    readonly maxW: number;
    readonly widthConstraint: InputShapeConstraint;
    // Input-width pixels per CTC timestep (the recognizer's horizontal downsample).
    readonly outStride: number;
    // Recognizer output vocab size V (charset length incl. the blank).
    readonly vocab: number;
    readonly norm: NormalizeOptions;
    readonly padValue: number;
    // How the strip's unused width is filled: flat `padValue`, or the content's
    // corner-mean background (avoids a seam some recognizers read as a glyph).
    readonly padMode: 'constant' | 'cornerMean';
  };
  readonly charset: string[];
  readonly minConfidence: number;
  readonly decode?: (
    probs: Tensor,
    charset: readonly string[]
  ) => { readonly text: string; readonly confidence: number };
};

// Per-run knobs for one OCR pass (the OCR-level subset of RunOcrOptions). A
// RunOcrOptions value is structurally assignable, so callers pass it directly.
type OcrPassOptions = {
  readonly vertical?: boolean;
  readonly tallCropRatio?: number;
  readonly maxRedetections?: number;
  readonly verticalMinConfidence?: number;
};

function pushDetection(
  out: OcrDetection[],
  threshold: number,
  text: string,
  conf: number,
  quad: Quad
): void {
  'worklet';
  if (text.length > 0 && conf >= threshold) {
    out.push({ text, confidence: conf, quad });
  }
}

/**
 * Runs one detect → recognize → reading-order pass over an on-device page tensor
 * (uint8 HWC), returning the recognized regions in reading order. Does NOT own
 * `page` — the caller allocates and disposes it — so the orientation/dewarp path
 * can feed its corrected page tensor straight in without a round-trip through an
 * {@link ImageBuffer}. The horizontal pass reads every quad; the opt-in vertical
 * pass additionally reads upright glyph stacks.
 * @param engine The resolved OCR engine (contract + model + run options).
 * @param page The page tensor to read (uint8 HWC); caller-owned.
 * @param width The page width in pixels.
 * @param height The page height in pixels.
 * @param format The pixel format of `page` (channels + color conversion).
 * @param options Per-pass toggles (vertical text, tall-crop ratio, re-detect cap).
 * @returns The recognized regions, in reading order.
 */
export function runOcrPassOnTensor(
  engine: OcrEngine,
  page: Tensor,
  width: number,
  height: number,
  format: ImageFormat,
  options?: OcrPassOptions
): OcrDetection[] {
  'worklet';
  const vertical = options?.vertical ?? false;
  const tallCropRatio = options?.tallCropRatio ?? TALL_CROP_RATIO;
  const maxRedetections = options?.maxRedetections ?? MAX_VERTICAL_REDETECTIONS;
  const verticalMinConf = options?.verticalMinConfidence ?? DEFAULT_VERTICAL_MIN_CONFIDENCE;
  const toRgbCode = FORMAT_CONVERSION[format].rgb;

  let tRecImage: Tensor | null = null;
  try {
    const quads = detectQuads(engine, page, width, height, format);
    if (quads.length === 0) {
      return [];
    }

    let recSrc = page;
    if (toRgbCode !== null) {
      tRecImage = tensor('uint8', [height, width, REC_CHANNELS]);
      recSrc = cvtColor(page, tRecImage, toRgbCode);
    }
    const budget = { remaining: maxRedetections };

    const detections: OcrDetection[] = [];
    const ordered: Quad[] = [];
    for (const quad of quads) {
      const orderedQuad = orderQuad(quad);
      const size = quadSize(orderedQuad);
      if (size.width >= MIN_BOX_SIDE && size.height >= MIN_BOX_SIDE) {
        ordered.push(orderedQuad);
      }
    }

    if (!vertical) {
      for (const orderedQuad of ordered) {
        const { text, conf } = recognizeQuad(engine, recSrc, orderedQuad);
        pushDetection(detections, engine.minConfidence, text, conf, orderedQuad);
      }
      return orderByReadingOrder(detections);
    }

    const { stacks, singles } = groupVerticalStacks(ordered);
    for (const stack of stacks) {
      const strip = recognizeGlyphStrip(engine, recSrc, stack);
      if (strip) {
        pushDetection(detections, verticalMinConf, strip.text, strip.conf, boundingQuadOf(stack));
      }
    }
    for (const orderedQuad of singles) {
      const size = quadSize(orderedQuad);
      if (size.height >= size.width * tallCropRatio) {
        const stacked = readStackedBox(engine, page, format, orderedQuad, size, budget);
        if (stacked) {
          pushDetection(detections, verticalMinConf, stacked.text, stacked.conf, orderedQuad);
          continue;
        }
      }
      const { text, conf } = recognizeQuad(engine, recSrc, orderedQuad);
      pushDetection(detections, engine.minConfidence, text, conf, orderedQuad);
    }
    return orderByReadingOrder(detections);
  } finally {
    tRecImage?.dispose();
  }
}

/**
 * Runs one OCR pass over an {@link ImageBuffer}, uploading it to a page tensor
 * and delegating to {@link runOcrPassOnTensor}.
 * @param engine The resolved OCR engine (contract + model + run options).
 * @param input The page (or region crop) to read.
 * @param options Per-pass toggles (vertical text, tall-crop ratio, re-detect cap).
 * @returns The recognized regions, in reading order.
 */
export function runOcrPass(
  engine: OcrEngine,
  input: ImageBuffer,
  options?: OcrPassOptions
): OcrDetection[] {
  'worklet';
  const numChannels = FORMAT_CHANNELS[input.format];
  const page = tensor('uint8', [input.height, input.width, numChannels]);
  try {
    page.setData(input.data);
    return runOcrPassOnTensor(engine, page, input.width, input.height, input.format, options);
  } finally {
    page.dispose();
  }
}

// ─── Contract ────────────────────────────────────────────────────────────────

/**
 * Validates the model's `detect` (RGB `[1,3,H,W]` in, model-defined outs) and
 * `recognize` (`[1,C,H,W]` in, `[1,T,V]` probs out; only the width may vary)
 * methods, resolves their legal input sizes from the model's own metadata, and
 * builds the CTC charset. Runs at construction; throws on any contract mismatch.
 * @param model The loaded fused detect/recognize model.
 * @param charsetOption The recognizer charset (string = one codepoint per index;
 * array = taken verbatim).
 * @returns The model-derived detect/recognize contract ({@link OcrEngine} minus
 * the run options `createOcr` adds).
 */
export function resolveOcrContract(
  model: Model,
  charsetOption: string | readonly string[]
): {
  det: Omit<OcrEngine['det'], 'norm'>;
  rec: Omit<OcrEngine['rec'], 'norm' | 'padValue' | 'padMode'>;
  charset: string[];
} {
  // Validate the detect input is RGB [1,3,H,W]; wildcard the outputs (count from
  // the model) so they stay unconstrained. The input size constraint itself comes
  // from getInputShapeConstraints below.
  const outCount = model.getMethodMeta('detect').outputTensorMeta.length;
  validateModelSchema(
    model,
    'detect',
    [SymbolicTensor('float32', [1, 3, 'H', 'W'])],
    Array.from({ length: outCount }, () => SymbolicTensor())
  );

  const recMeta = validateModelSchema(
    model,
    'recognize',
    [SymbolicTensor('float32', [1, 'C', 'H', 'W'])],
    [SymbolicTensor('float32', [1, 'T', 'V'])]
  );
  const widthConstraint = model.getInputShapeConstraints('recognize')[0]!;
  // [min, max] extent of each NCHW input dim: a dynamic range gives them
  // directly, a static shape has min === max, an enumerated set reduces across
  // its shapes.
  const extents: readonly (readonly [number, number])[] =
    'dims' in widthConstraint
      ? widthConstraint.dims.map((d) => [d.min, d.max] as const)
      : 'shape' in widthConstraint
        ? widthConstraint.shape.map((s) => [s, s] as const)
        : widthConstraint.shapes[0]!.map((_, dim) =>
            widthConstraint.shapes.reduce<readonly [number, number]>(
              ([min, max], shape) => [Math.min(min, shape[dim]!), Math.max(max, shape[dim]!)],
              [Infinity, -Infinity]
            )
          );
  for (const dim of [0, 1, 2]) {
    const [min, max] = extents[dim]!;
    if (min !== max) {
      throw new Error(
        `OCR: recognizer input dimension ${dim} must be fixed (only the width may vary), ` +
          `but the model declares [${min}, ${max}].`
      );
    }
  }
  const recC = extents[1]![0];
  const recH = extents[2]![0];
  const maxW = extents[3]![1];
  if (recC !== REC_CHANNELS) {
    throw new Error(`OCR: recognizer must take RGB (3 channels), but the model expects ${recC}.`);
  }

  // CTC lookup: index 0 is the blank, then the model's characters (a string
  // splits into codepoints; an array is taken verbatim, preserving ligatures).
  const charset = [
    '[blank]',
    ...(typeof charsetOption === 'string' ? Array.from(charsetOption) : charsetOption),
  ];
  const outShape = recMeta.outputTensorMeta[0]!.shape;
  const vocabSize = outShape[2]!;
  if (charset.length !== vocabSize) {
    throw new Error(
      `OCR: charset size (${charset.length}, incl. blank) must match recognizer output vocab (${vocabSize}).`
    );
  }
  // The recognizer reduces the input width onto the CTC time axis by a fixed
  // factor; derive it from the model's static (width, timesteps) so the probs
  // output can be pre-allocated for any legal width.
  const outStride = recMeta.inputTensorMeta[0]!.shape[3]! / outShape[1]!;

  return {
    det: { constraint: model.getInputShapeConstraints('detect')[0]! },
    rec: { recH, maxW, widthConstraint, outStride, vocab: vocabSize },
    charset,
  };
}
