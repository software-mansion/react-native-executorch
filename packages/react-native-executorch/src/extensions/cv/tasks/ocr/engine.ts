// OCR detect → recognize engine, internal to the OCR task. Worklet source order
// matters: a referenced worklet must be defined above its callers.

import { tensor, type Tensor } from '../../../../core/tensor';
import { RnExecuTorchError } from '../../../../core/error';
import {
  validateSpec,
  method,
  constr,
  f32,
  StaticDim,
  DynamicDim,
  type ConcreteDim,
  type DimRef,
  type LinearConstraint,
  type ModelSpec,
  type Range,
  type SymbolicDim,
  type TensorSpec,
} from '../../../../core/schema';
import type { Model } from '../../../../core/model';

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
import { mapQuadToImage, orderQuad, quadSize, splitWideQuad, type Quad } from '../../ops/quad';
import { ctcGreedyDecode } from '../../utils/ocrUtils';
import type { TextBoxExtractor } from './detectors';
import { orderByReadingOrder } from './geometry';

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

// A dimension whose legal values are sparse (an `enum`) can jump a long way from
// one value to the next, so an image at most this fraction larger than a legal
// value still snaps DOWN to it rather than forcing the next, much bigger one.
// A `range` steps densely, so it always snaps up.
const SNAP_DOWN_TOLERANCE = 0.1;

// The inclusive [min, max] extent of a dimension's domain.
function dimExtent(dim: ConcreteDim): readonly [number, number] {
  'worklet';
  if (dim.kind === 'constant') {
    return [dim.value, dim.value];
  }
  if (dim.kind === 'range') {
    return [dim.range.min, dim.range.max];
  }
  let min = Infinity;
  let max = -Infinity;
  for (const choice of dim.choices) {
    min = Math.min(min, choice);
    max = Math.max(max, choice);
  }
  return [min, max];
}

// Smallest value on `range`'s lattice that is >= `size` and satisfies `isLegal`,
// else the largest legal lattice point. Never shrinks content; only the range max
// can.
function snapUpRange(size: number, range: Range, isLegal: (value: number) => boolean): number {
  'worklet';
  const step = Math.max(1, range.step);
  const maxSteps = Math.floor((range.max - range.min) / step);
  for (let k = Math.max(0, Math.ceil((size - range.min) / step)); k <= maxSteps; k++) {
    const target = range.min + k * step;
    if (isLegal(target)) {
      return target;
    }
  }
  // Overflow (or nothing legal above `size`): the largest legal lattice point.
  // `range.max` itself may sit off the lattice, hence the walk down from maxSteps.
  for (let k = maxSteps; k >= 0; k--) {
    const target = range.min + k * step;
    if (isLegal(target)) {
      return target;
    }
  }
  // No legal size anywhere in the range — the load-time contract check rejects
  // this, so returning the largest lattice point here is only a safety net.
  return range.min + maxSteps * step;
}

// Smallest legal choice >= `size` (modulo SNAP_DOWN_TOLERANCE when
// `tolerateShrink`), else the largest legal choice.
function snapUpEnum(
  size: number,
  choices: readonly number[],
  isLegal: (value: number) => boolean,
  tolerateShrink: boolean
): number {
  'worklet';
  const legal = choices.filter(isLegal).sort((a, b) => a - b);
  const usable = legal.length > 0 ? legal : [...choices].sort((a, b) => a - b);
  const floor = tolerateShrink ? size / (1 + SNAP_DOWN_TOLERANCE) : size;
  return usable.find((choice) => choice >= floor) ?? usable[usable.length - 1]!;
}

// The legal size closest above `size` in `dim`'s domain, restricted to the values
// `isLegal` accepts (the detector's input alignment, the recognizer's CTC timestep
// lattice). A `constant` domain has a single value, so `size` is ignored.
function snapDim(
  size: number,
  dim: ConcreteDim,
  isLegal: (value: number) => boolean,
  tolerateShrink = false
): number {
  'worklet';
  if (dim.kind === 'constant') {
    return dim.value;
  }
  if (dim.kind === 'enum') {
    return snapUpEnum(size, dim.choices, isLegal, tolerateShrink);
  }
  return snapUpRange(size, dim.range, isLegal);
}

// Whether `dim`'s domain contains any value `isLegal` accepts. Answered by running
// the very search the run-time path uses, so the two can never disagree: `snapDim`
// walks the whole domain when nothing above the requested size qualifies, and only
// returns an illegal value when the domain holds none at all.
function domainAdmits(dim: ConcreteDim, isLegal: (value: number) => boolean): boolean {
  const [min] = dimExtent(dim);
  return isLegal(snapDim(min, dim, isLegal));
}

// Largest legal detector input size that avoids upscaling where the domains allow
// it (a domain whose values all exceed the image must upscale). H and W snap
// independently — a per-dimension domain is by construction independent of the
// other, so the legal set is their full grid.
function resolveDetectorSize(
  det: OcrEngine['det'],
  imgWidth: number,
  imgHeight: number,
  align: number
): { detW: number; detH: number } {
  'worklet';
  const isAligned = (value: number) => {
    'worklet';
    return value % align === 0;
  };
  const scale = Math.min(1, dimExtent(det.h)[1] / imgHeight, dimExtent(det.w)[1] / imgWidth);
  return {
    detW: snapDim(Math.round(imgWidth * scale), det.w, isAligned, true),
    detH: snapDim(Math.round(imgHeight * scale), det.h, isAligned, true),
  };
}

// The recognizer's input width and its CTC timestep count are related by the
// `linear` runtime constraint the model declares over them: `width = pixelsPerStep
// * timesteps + offset`. SVTR reduces the width by a plain factor (8, 0); the CRNN
// crops one trailing timestep, so it is affine (4, 4) — inferring a width/timestep
// ratio would be wrong for it.

type CtcStride = {
  readonly pixelsPerStep: number;
  readonly offset: number;
};

// Where that constraint's two dimensions live in `recognize`: the input width is
// NCHW dim 3 of the only input tensor, the timestep count is dim 1 of the only
// output tensor.
const REC_WIDTH_REF: DimRef = { paramSide: 'input', tensorIdx: 0, dimIdx: 3 };
const REC_TIMESTEPS_REF: DimRef = { paramSide: 'output', tensorIdx: 0, dimIdx: 1 };

// Whether a width sits on the timestep lattice — i.e. yields a whole number of
// CTC timesteps, so `recognizeCanvas` can pre-size the probs tensor for it.
function onCtcLattice(width: number, stride: CtcStride): boolean {
  'worklet';
  return (width - stride.offset) % stride.pixelsPerStep === 0;
}

// The CTC timestep count a legal width produces.
function ctcTimesteps(width: number, stride: CtcStride): number {
  'worklet';
  return (width - stride.offset) / stride.pixelsPerStep;
}

// Recognizer input width: the smallest legal width >= the desired content, so
// snapping never squishes (only the domain max can). Restricted to widths sitting
// on the CTC timestep lattice, so the probs output can always be pre-sized.
function resolveRecWidth(width: ConcreteDim, desiredWidth: number, stride: CtcStride): number {
  'worklet';
  return snapDim(desiredWidth, width, (value) => {
    'worklet';
    return onCtcLattice(value, stride);
  });
}

// ─── CTC decode ──────────────────────────────────────────────────────────────

// Greedy-CTC decode of `[..,T,V]` probs: a native op returns per-timestep
// [idx, value, ...]; drop blank (idx 0) + consecutive repeats, mean-conf the rest.
function greedyCtcDecode(
  probs: Tensor,
  charset: readonly string[]
): { text: string; conf: number } {
  'worklet';
  const flat = ctcGreedyDecode(probs);
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

// Degenerate-quad guard, in ORIGINAL IMAGE pixels and applied to every
// detector's output after it is mapped back from detector space. Distinct from
// DBNet's `minBoxSide`, which drops contour candidates in detector-input pixels
// before the unclip step — that one is a decode threshold, this one is the
// last check before a quad is warped onto the recognizer canvas.
const MIN_RECOGNIZABLE_SIDE = 3;

// The recognizer input is contractually RGB (enforced by resolveOcrContract).
const REC_CHANNELS = 3;

// Detects text boxes in `src`, returning quads in `src` pixel space.
function detectQuads(
  engine: OcrEngine,
  src: Tensor,
  width: number,
  height: number,
  format: ImageFormat
): Quad[] {
  'worklet';
  const numChannels = FORMAT_CHANNELS[format];
  const toRgbCode = FORMAT_CONVERSION[format].rgb;
  const align = Math.max(1, engine.extractBoxes.inputAlignment ?? 1);
  const { detW, detH } = resolveDetectorSize(engine.det, width, height, align);
  // Resolve output shapes before allocating — the extractor may throw on a
  // size it cannot decode, and nothing must leak on that path.
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
    const quads = engine.extractBoxes.extract(tOutputs, { width: detW, height: detH });
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
  const { recH, stride, vocab, norm } = engine.rec;
  const tCF = tensor('uint8', [REC_CHANNELS, recH, snappedW]);
  const tNorm = tensor('float32', [REC_CHANNELS, recH, snappedW]);
  const tInput = tensor('float32', [1, REC_CHANNELS, recH, snappedW]);
  // The width the caller snapped to sits on the timestep lattice by construction,
  // so the dynamically-sized probs output can be pre-allocated exactly.
  const timesteps = ctcTimesteps(snappedW, stride);
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
  const { recH, maxW, width, stride, padValue } = engine.rec;
  const size = quadSize(quad);
  // Aspect-preserving width of the content at recognizer height (>= 1 px).
  const aspectWidth = Math.max(1, Math.round((recH * size.width) / Math.max(1, size.height)));
  const contentW = Math.min(aspectWidth, maxW);
  const snappedW = resolveRecWidth(width, contentW, stride);
  const tCanvas = tensor('uint8', [recH, snappedW, REC_CHANNELS]);
  try {
    rectifyQuad(src, tCanvas, quad, {
      contentWidth: contentW,
      align: 'left',
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
  // Known limitation: segments abut with no overlap, so a glyph straddling a cut
  // can be mangled/dropped at the seam. An overlap margin + de-dup would fix it;
  // acceptable for now since a line this wide is the rare case.
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

// ─── OCR pass ────────────────────────────────────────────────────────────────

/**
 * The resolved, model-level state one detect → recognize pass needs — the model
 * itself, the validated detect/recognize contract, the CTC charset, and the run
 * options. Built once by `createOcr`, reused across every page and per-region call.
 */
export type OcrEngine = {
  readonly model: Model;
  readonly extractBoxes: TextBoxExtractor;
  readonly det: {
    // The exported domains of the detector input's H and W (NCHW dims 2 and 3).
    readonly h: ConcreteDim;
    readonly w: ConcreteDim;
    readonly norm: NormalizeOptions;
  };
  readonly rec: {
    readonly recH: number;
    readonly maxW: number;
    // The exported domain of the recognizer input's width (NCHW dim 3).
    readonly width: ConcreteDim;
    readonly stride: CtcStride;
    // Recognizer output vocab size V (charset length incl. the blank).
    readonly vocab: number;
    readonly norm: NormalizeOptions;
    readonly padValue: number;
  };
  readonly charset: string[];
  readonly minConfidence: number;
  readonly decode?: (
    probs: Tensor,
    charset: readonly string[]
  ) => { readonly text: string; readonly confidence: number };
};

/**
 * Runs one detect → recognize → reading-order pass over an {@link ImageBuffer}:
 * detect text quads on the whole page, warp each to the recognizer canvas, read
 * it, and sort the results into reading order.
 * @param engine The resolved OCR engine (contract + model + options).
 * @param input The page to read.
 * @returns The recognized regions, in reading order.
 */
export function runOcrPass(engine: OcrEngine, input: ImageBuffer): OcrDetection[] {
  'worklet';
  const { width, height, format } = input;
  const numChannels = FORMAT_CHANNELS[format];
  const toRgbCode = FORMAT_CONVERSION[format].rgb;
  const tPage = tensor('uint8', [height, width, numChannels]);
  let tRecImage: Tensor | null = null;
  try {
    tPage.setData(input.data);
    const quads = detectQuads(engine, tPage, width, height, format);
    if (quads.length === 0) {
      return [];
    }

    let recSrc: Tensor = tPage;
    if (toRgbCode !== null) {
      tRecImage = tensor('uint8', [height, width, REC_CHANNELS]);
      recSrc = cvtColor(tPage, tRecImage, toRgbCode);
    }

    const detections: OcrDetection[] = [];
    for (const quad of quads) {
      const orderedQuad = orderQuad(quad);
      const size = quadSize(orderedQuad);
      if (size.width < MIN_RECOGNIZABLE_SIDE || size.height < MIN_RECOGNIZABLE_SIDE) {
        continue;
      }
      const { text, conf } = recognizeQuad(engine, recSrc, orderedQuad);
      if (text.length > 0 && conf >= engine.minConfidence) {
        detections.push({ text, confidence: conf, quad: orderedQuad });
      }
    }
    return orderByReadingOrder(detections);
  } finally {
    tRecImage?.dispose();
    tPage.dispose();
  }
}
// ─── Contract ────────────────────────────────────────────────────────────────

type DimFactory = (symbol: string) => SymbolicDim;

function refsEqual(a: DimRef, b: DimRef): boolean {
  return a.paramSide === b.paramSide && a.tensorIdx === b.tensorIdx && a.dimIdx === b.dimIdx;
}

// Reads the width↔timesteps relation the recognizer declares. It is discovered
// rather than assumed because it differs per architecture; `resolveOcrContract`
// feeds the result back into the allowed spec so `validateSpec` still matches the
// constraint 1-to-1 and rejects any others the model may declare.
function readCtcStride(schema: ModelSpec<ConcreteDim>): CtcStride {
  const constraints = schema.recognize?.runtimeConstraints ?? [];
  const linear = constraints.find(
    (c): c is LinearConstraint =>
      c.kind === 'linear' &&
      refsEqual(c.dimLhs, REC_WIDTH_REF) &&
      refsEqual(c.dimRhs, REC_TIMESTEPS_REF)
  );
  if (linear === undefined) {
    throw RnExecuTorchError(
      'SCHEMA_MISMATCH',
      'resolveOcrContract: the recognizer must declare a linear runtime constraint relating ' +
        'its input width (input 0, dim 3) to its CTC timesteps (output 0, dim 1); the pipeline ' +
        'needs it to pre-size the probs output.'
    );
  }
  const [pixelsPerStep, offset] = linear.coefficients;
  if (pixelsPerStep <= 0) {
    throw RnExecuTorchError(
      'SCHEMA_MISMATCH',
      `resolveOcrContract: the recognizer's width-per-timestep coefficient must be positive, ` +
        `but the model declares ${pixelsPerStep}.`
    );
  }
  return { pixelsPerStep, offset };
}

// The exported domain of one tensor dimension. `validateSpec` has already proved
// the method exists with this rank, so the lookup cannot miss.
function exportedDim(schema: ModelSpec<ConcreteDim>, methodName: string, ref: DimRef): ConcreteDim {
  const methodSpec = schema[methodName]!;
  const params = ref.paramSide === 'input' ? methodSpec.inputs : methodSpec.outputs;
  const tensors = params.filter((p): p is TensorSpec<ConcreteDim> => p.kind === 'Tensor');
  return tensors[ref.tensorIdx]!.shape[ref.dimIdx]!;
}

/**
 * Validates the model's `detect` (RGB `[1,3,H,W]` in, extractor-defined outs) and
 * `recognize` (RGB `[1,3,H,W]` in, `[1,T,V]` probs out; only the width may vary)
 * methods against the exported schema, resolves their legal input sizes, and
 * builds the CTC charset. Runs at construction; throws on any contract mismatch.
 * @param model The loaded fused detect/recognize model.
 * @param charsetOption The recognizer charset (string = one codepoint per index;
 * array = taken verbatim).
 * @param extractBoxes The detector's box extractor — it declares the `detect`
 * output layout it decodes, and its alignment is checked against the model's
 * legal input sizes.
 * @returns The model-derived detect/recognize contract ({@link OcrEngine} minus
 * the run options `createOcr` adds).
 */
export function resolveOcrContract(
  model: Model,
  charsetOption: string | readonly string[],
  extractBoxes: TextBoxExtractor
): {
  det: Omit<OcrEngine['det'], 'norm'>;
  rec: Omit<OcrEngine['rec'], 'norm' | 'padValue'>;
  charset: string[];
} {
  const schema = model.schema;
  const stride = readCtcStride(schema);

  // Either method may be exported at a fixed size or with varying sizes, and the
  // two choices are independent (a size-varying detector can pair with a
  // fixed-width recognizer), so all four combinations are offered as variants. A
  // `static` symbol binds only to a constant dimension and a `dynamic` one only to
  // a range or enum, which is exactly what separates them.
  const variant = (detDim: DimFactory, recDim: DimFactory) => ({
    ...method(
      'detect',
      [f32(1, 3, detDim('detH'), detDim('detW'))],
      extractBoxes.detectOutputSpec(detDim)
    ),
    ...method(
      'recognize',
      [f32(1, REC_CHANNELS, 'recH', recDim('recW'))],
      [f32(1, recDim('recT'), 'vocab')],
      [constr.linear(REC_WIDTH_REF, REC_TIMESTEPS_REF, stride.pixelsPerStep, stride.offset)]
    ),
  });

  const { dims } = validateSpec(schema, {
    dynamicDetectDynamicRec: variant(DynamicDim, DynamicDim),
    dynamicDetectFixedRec: variant(DynamicDim, StaticDim),
    fixedDetectDynamicRec: variant(StaticDim, DynamicDim),
    fixedDetectFixedRec: variant(StaticDim, StaticDim),
  });
  const [recH, vocabSize] = dims.constant('recH', 'vocab');

  const det = {
    h: exportedDim(schema, 'detect', { paramSide: 'input', tensorIdx: 0, dimIdx: 2 }),
    w: exportedDim(schema, 'detect', { paramSide: 'input', tensorIdx: 0, dimIdx: 3 }),
  };
  const width = exportedDim(schema, 'recognize', REC_WIDTH_REF);

  // Reject at load, not per run, a detector whose legal sizes the extractor can't
  // decode: `resolveDetectorSize` only ever returns a size the domain admits, so
  // if no such size is a multiple of the extractor's alignment, every run fails.
  const detAlign = Math.max(1, extractBoxes.inputAlignment ?? 1);
  if (detAlign > 1) {
    for (const [axis, dim] of [
      ['height', det.h],
      ['width', det.w],
    ] as const) {
      if (!domainAdmits(dim, (value) => value % detAlign === 0)) {
        throw RnExecuTorchError(
          'SCHEMA_MISMATCH',
          `resolveOcrContract: no legal detector input ${axis} is a multiple of the extractor's ` +
            `required alignment (${detAlign}), so decoding would fail on every run.`
        );
      }
    }
  }

  // Likewise, `recognizeCanvas` pre-allocates the probs tensor as
  // [1, ctcTimesteps(width), V], so the width the runtime picks must land on the
  // timestep lattice — the domain has to admit at least one such width.
  if (!domainAdmits(width, (value) => onCtcLattice(value, stride))) {
    throw RnExecuTorchError(
      'SCHEMA_MISMATCH',
      `resolveOcrContract: no legal recognizer width yields a whole number of CTC timesteps ` +
        `(width = ${stride.pixelsPerStep} * timesteps + ${stride.offset}), so the probs tensor ` +
        `can't be pre-sized.`
    );
  }

  // CTC lookup: index 0 is the blank, then the model's characters (a string
  // splits into codepoints; an array is taken verbatim, preserving ligatures).
  const charset = [
    '[blank]',
    ...(typeof charsetOption === 'string' ? Array.from(charsetOption) : charsetOption),
  ];
  if (charset.length !== vocabSize) {
    throw RnExecuTorchError(
      'SCHEMA_MISMATCH',
      `resolveOcrContract: charset size (${charset.length}, incl. blank) must match the ` +
        `recognizer output vocab (${vocabSize}).`
    );
  }

  return {
    det,
    rec: { recH, maxW: dimExtent(width)[1], width, stride, vocab: vocabSize },
    charset,
  };
}
