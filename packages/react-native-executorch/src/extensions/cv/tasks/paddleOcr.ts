// PP-OCRv6: a DBNet text detector and an SVTR recognizer fused into one PTE.
// One pass locates every text line on the page, warps each to the recognizer
// canvas and reads it. Worklet source order matters here: a referenced worklet
// must be defined above its callers.

import type { WorkletRuntime } from 'react-native-worklets';
import RNBlobUtil from 'react-native-blob-util';

import { loadModel, type Model } from '../../../core/model';
import { RnExecuTorchError } from '../../../core/error';
import { wrapAsync } from '../../../core/runtime';
import { tensor, type Tensor } from '../../../core/tensor';
import {
  validateSpec,
  method,
  constr,
  f32,
  DynamicDim,
  type ConcreteDim,
  type DimRef,
  type LinearConstraint,
  type ModelSpec,
  type Range,
  type TensorSpec,
} from '../../../core/schema';
import { IMAGENET_NORM } from '../../../constants';

import type { ImageBuffer, ImageFormat } from '../image';
import {
  resize,
  cvtColor,
  toChannelsFirst,
  normalize,
  FORMAT_CHANNELS,
  FORMAT_CONVERSION,
  type NormalizeOptions,
} from '../ops/image';
import { interpolatePoint } from '../ops/points';
import {
  boundingBoxOfPoints,
  orderQuad,
  quadSize,
  rectifyQuad,
  scaleQuad,
  type Quad,
} from '../ops/quad';
import { ctcGreedyDecode, extractDbnetTextQuads } from '../utils/paddleOcrUtils';

/**
 * A single recognized text region.
 * @category Types
 */
export type OcrDetection = {
  /** The recognized text. */
  readonly text: string;
  /** Mean per-character probability over the non-blank timesteps, in `[0, 1]`. */
  readonly confidence: number;
  /**
   * The region's corners, ordered top-left, top-right, bottom-right, bottom-left,
   * in original image pixels. Oriented, so a rotated line keeps its angle; take
   * `boundingBoxOfPoints(quad, 'xyxy')` for the axis-aligned box.
   */
  readonly quad: Quad;
};

/**
 * Options for the PP-OCRv6 pipeline.
 * @category Types
 */
export type PaddleOcrModelOptions = {
  /**
   * Drop detections whose confidence falls below this, unless a call overrides
   * it.
   */
  readonly defaultConfidenceThreshold: number;
};

/**
 * Model configuration for the PP-OCRv6 pipeline: one fused detect/recognize PTE,
 * the charset published beside it, and the run options.
 * @category Types
 */
export type PaddleOcrModel = {
  /** The fused detect/recognize PTE. Resolved to a local path by the fetcher. */
  readonly modelPath: string;
  /**
   * The recognizer charset published beside the model: a JSON array of strings,
   * one per class, where `charset[i]` labels logit `i + 1` (logit 0 is the CTC
   * blank). Resolved to a local path by the resource fetcher like `modelPath`.
   */
  readonly charsetPath: string;
  /** Run options. See {@link PaddleOcrModelOptions}. */
  readonly modelOpts: PaddleOcrModelOptions;
};

// Fixed by the export: the detector was trained on ImageNet-normalized RGB and
// the recognizer on (x/255 - 0.5)/0.5.
const DETECTOR_NORM: NormalizeOptions = IMAGENET_NORM;
const RECOGNIZER_NORM: NormalizeOptions = { alpha: 1 / 127.5, beta: -1 };
const RECOGNIZER_PAD_VALUE = 128; // neutral gray
const REC_CHANNELS = 3;

// DBNet decode thresholds, tuned for this checkpoint.
const DBNET_DECODE = {
  binThreshold: 0.3,
  boxThreshold: 0.6,
  unclipRatio: 1.5,
  minBoxSide: 3,
  maxCandidates: 1000,
} as const;

// A line at most this factor wider than the recognizer max is squished into it;
// anything wider is split and read piecewise (a hard clamp is unreadable).
const WIDE_SQUISH_TOLERANCE = 1.15;

// Degenerate-quad guard, in ORIGINAL IMAGE pixels, applied after a quad is
// mapped back from detector space. Distinct from DBNET_DECODE.minBoxSide, which
// drops contour candidates in detector-input pixels before the unclip step.
const MIN_RECOGNIZABLE_SIDE = 3;

// A dimension whose legal values are sparse (an `enum`, which is what the CoreML
// export ships since CoreML has no RangeDim) can jump a long way from one value
// to the next, so an image at most this fraction larger than a legal value still
// snaps DOWN to it rather than forcing the next, much bigger one. A `range` steps
// densely, so it always snaps up.
const SNAP_DOWN_TOLERANCE = 0.1;

// ─── Quad helpers (task-private: too specific to belong in ops/quad) ─────────

// A gutter must be at least this fraction of the content width to split columns;
// two boxes share a line when their vertical extents overlap by at least this
// fraction of the shorter box's height.
const COLUMN_GAP_FRACTION = 0.06;
const LINE_OVERLAP_FRACTION = 0.3;

/**
 * Reorders `{quad}` items the way a human reads the page: leftmost column first
 * (top to bottom), then the next column. Detectors emit boxes in arbitrary
 * order, so results are sorted through this before being returned.
 * @typeParam T The item type, anything carrying a `quad`.
 * @param items The items to sort.
 * @returns The same items in reading order.
 */
function orderByReadingOrder<T extends { quad: Quad }>(items: T[]): T[] {
  'worklet';
  const count = items.length;
  if (count <= 1) {
    return items;
  }

  const boxes = items.map((it) => boundingBoxOfPoints(it.quad, 'xyxy'));

  // A vertical gap between boxes only counts as a column gutter when it is
  // reasonably wide relative to the page content (else word spacing would
  // split columns everywhere).
  let minX = Infinity;
  let maxX = -Infinity;
  for (const box of boxes) {
    if (box.xmin < minX) minX = box.xmin;
    if (box.xmax > maxX) maxX = box.xmax;
  }
  const minGap = COLUMN_GAP_FRACTION * Math.max(1, maxX - minX);

  // Find the gutters: walk every box's left/right edge in x order, keeping a
  // running count of how many boxes overlap the current x. Count 0 means no
  // box occupies this x — when such an empty stretch is wider than minGap,
  // cut a column boundary at its midpoint.
  const edges: { x: number; delta: number }[] = [];
  for (const box of boxes) {
    edges.push({ x: box.xmin, delta: 1 });
    edges.push({ x: box.xmax, delta: -1 });
  }
  // At the same x, process a box's left edge before another's right edge —
  // two boxes that exactly touch must not look like an empty stretch.
  edges.sort((a, b) => a.x - b.x || b.delta - a.delta);
  const cuts: number[] = [];
  let coverage = 0;
  // Seed to the first (leftmost) edge, not 0, so a page whose leftmost box starts
  // well inside a left margin doesn't read that margin as an empty column gutter.
  let gutterStart = edges.length > 0 ? edges[0]!.x : 0;
  for (const edge of edges) {
    const before = coverage;
    coverage += edge.delta;
    if (before > 0 && coverage === 0) {
      gutterStart = edge.x;
    } else if (before === 0 && coverage > 0 && edge.x - gutterStart >= minGap) {
      cuts.push((gutterStart + edge.x) / 2);
    }
  }

  // A box belongs to column k when exactly k cuts lie left of its center.
  const columns: number[][] = Array.from({ length: cuts.length + 1 }, () => []);
  for (let i = 0; i < count; i++) {
    const centerX = (boxes[i]!.xmin + boxes[i]!.xmax) / 2;
    let column = 0;
    for (const cut of cuts) {
      if (centerX > cut) column++;
    }
    columns[column]!.push(i);
  }

  // Inside each column: boxes whose vertical extents overlap enough sit on the
  // same text line. Read lines top to bottom, and boxes within a line left to
  // right.
  const order: number[] = [];
  for (const column of columns) {
    column.sort((a, b) => boxes[a]!.ymin - boxes[b]!.ymin);
    const lines: { items: number[]; ymin: number; ymax: number }[] = [];
    for (const i of column) {
      const box = boxes[i]!;
      let placed = false;
      for (const line of lines) {
        // Overlap is measured against the SHORTER of the two heights, so a
        // small box beside a tall one still joins its line.
        const overlap = Math.min(line.ymax, box.ymax) - Math.max(line.ymin, box.ymin);
        const minHeight = Math.min(line.ymax - line.ymin, box.ymax - box.ymin);
        if (overlap >= LINE_OVERLAP_FRACTION * Math.max(1, minHeight)) {
          line.items.push(i);
          line.ymin = Math.min(line.ymin, box.ymin);
          line.ymax = Math.max(line.ymax, box.ymax);
          placed = true;
          break;
        }
      }
      if (!placed) {
        lines.push({ items: [i], ymin: box.ymin, ymax: box.ymax });
      }
    }
    lines.sort((a, b) => a.ymin - b.ymin);
    for (const line of lines) {
      line.items.sort(
        (a, b) => boxes[a]!.xmin + boxes[a]!.xmax - (boxes[b]!.xmin + boxes[b]!.xmax)
      );
      order.push(...line.items);
    }
  }
  return order.map((i) => items[i]!);
}

/**
 * Splits an ordered TL,TR,BR,BL quad into `parts` equal horizontal segments
 * (each an ordered quad), left to right. `parts <= 1` returns the quad
 * unchanged.
 * @param ordered The quad corners ordered TL, TR, BR, BL.
 * @param parts The number of equal horizontal segments to split into.
 * @returns The segments as ordered TL,TR,BR,BL quads, left to right.
 */
function splitWideQuad(ordered: Quad, parts: number): Quad[] {
  'worklet';
  if (parts <= 1) {
    return [ordered];
  }
  const [tl, tr, br, bl] = ordered;
  const out: Quad[] = [];
  for (let i = 0; i < parts; i++) {
    const t0 = i / parts;
    const t1 = (i + 1) / parts;
    out.push([
      interpolatePoint(tl, tr, t0),
      interpolatePoint(tl, tr, t1),
      interpolatePoint(bl, br, t1),
      interpolatePoint(bl, br, t0),
    ]);
  }
  return out;
}

// ─── Input size resolution ───────────────────────────────────────────────────

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
// `isLegal` accepts. A `constant` domain has a single value, so `size` is ignored.
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

// Whether any value the domain admits satisfies `isLegal`.
function domainAdmits(dim: ConcreteDim, isLegal: (value: number) => boolean): boolean {
  const [min] = dimExtent(dim);
  return isLegal(snapDim(min, dim, isLegal));
}

// Largest legal detector input size that avoids upscaling where the domains allow
// it (a domain whose values all exceed the image must upscale). H and W snap
// independently — a per-dimension domain is by construction independent of the
// other, so the legal set is their full grid.
function resolveDetectorSize(
  det: PaddleOcrEngine['det'],
  imgWidth: number,
  imgHeight: number
): { detW: number; detH: number } {
  'worklet';
  const anySize = () => {
    'worklet';
    return true;
  };
  const scale = Math.min(1, dimExtent(det.h)[1] / imgHeight, dimExtent(det.w)[1] / imgWidth);
  return {
    detW: snapDim(Math.round(imgWidth * scale), det.w, anySize, true),
    detH: snapDim(Math.round(imgHeight * scale), det.h, anySize, true),
  };
}

// The recognizer's input width and its CTC timestep count are related by the
// `linear` runtime constraint the model declares over them: `width = pixelsPerStep
// * timesteps + offset`. SVTR reduces the width by a plain factor (8, 0), but the
// relation is read from the model rather than assumed.
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
// CTC timesteps, so the probs tensor can be pre-sized for it.
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

// ─── Execution ───────────────────────────────────────────────────────────────

// Greedy-CTC decode of `[1,T,V]` probs: a native op returns per-timestep
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

// Detects text quads in `src`, returning them in `src` pixel space.
function detectQuads(
  engine: PaddleOcrEngine,
  src: Tensor,
  width: number,
  height: number,
  format: ImageFormat
): Quad[] {
  'worklet';
  const numChannels = FORMAT_CHANNELS[format];
  const toRgbCode = FORMAT_CONVERSION[format].rgb;
  const { detW, detH } = resolveDetectorSize(engine.det, width, height);
  const tResize = tensor('uint8', [detH, detW, numChannels]);
  const tColor = toRgbCode !== null ? tensor('uint8', [detH, detW, 3]) : null;
  const tCF = tensor('uint8', [3, detH, detW]);
  const tNorm = tensor('float32', [3, detH, detW]);
  const tInput = tensor('float32', [1, 3, detH, detW]);
  // DBNet emits one full-resolution probability map, [1, 1, H, W].
  const tProb = tensor('float32', [1, 1, detH, detW]);
  try {
    src
      .through(resize, tResize, { mode: 'letterbox', interpolation: 'area', padValue: 0 })
      .throughIf(tColor !== null, cvtColor, tColor!, toRgbCode!)
      .through(toChannelsFirst, tCF)
      .through(normalize, tNorm, DETECTOR_NORM)
      .copyTo(tInput);

    engine.model.execute('detect', [tInput], [tProb]);
    const quads = extractDbnetTextQuads(tProb, DBNET_DECODE);
    return quads.map((q) =>
      scaleQuad(q, { from: { width: detW, height: detH }, to: { width, height } })
    );
  } finally {
    tResize.dispose();
    tColor?.dispose();
    tCF.dispose();
    tNorm.dispose();
    tInput.dispose();
    tProb.dispose();
  }
}

// Recognizes a canvas already sized to a legal recognizer width.
function recognizeCanvas(
  engine: PaddleOcrEngine,
  tCanvas: Tensor,
  snappedW: number
): { text: string; conf: number } {
  'worklet';
  const { recH, stride, vocab } = engine.rec;
  const tCF = tensor('uint8', [REC_CHANNELS, recH, snappedW]);
  const tNorm = tensor('float32', [REC_CHANNELS, recH, snappedW]);
  const tInput = tensor('float32', [1, REC_CHANNELS, recH, snappedW]);
  // The width the caller snapped to sits on the timestep lattice by construction,
  // so the dynamically-sized probs output can be pre-allocated exactly.
  const timesteps = ctcTimesteps(snappedW, stride);
  const tProbs = tensor('float32', [1, timesteps, vocab]);
  try {
    tCanvas.through(toChannelsFirst, tCF).through(normalize, tNorm, RECOGNIZER_NORM).copyTo(tInput);
    engine.model.execute('recognize', [tInput], [tProbs]);
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
  engine: PaddleOcrEngine,
  src: Tensor,
  quad: Quad
): { text: string; conf: number } {
  'worklet';
  const { recH, maxW, width, stride } = engine.rec;
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
      padValue: RECOGNIZER_PAD_VALUE,
    });
    return recognizeCanvas(engine, tCanvas, snappedW);
  } finally {
    tCanvas.dispose();
  }
}

// Recognizes one ordered (TL,TR,BR,BL) quad. A line wider than the tolerance is
// split into segments read piecewise; confidence is the length-weighted mean.
function recognizeQuad(
  engine: PaddleOcrEngine,
  src: Tensor,
  quad: Quad
): { text: string; conf: number } {
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

// The resolved, model-level state one detect → recognize pass needs. Built once
// by createPaddleOcr and reused across every call.
type PaddleOcrEngine = {
  readonly model: Model;
  readonly det: {
    // The exported domains of the detector input's H and W (NCHW dims 2 and 3).
    readonly h: ConcreteDim;
    readonly w: ConcreteDim;
  };
  readonly rec: {
    readonly recH: number;
    readonly maxW: number;
    // The exported domain of the recognizer input's width (NCHW dim 3).
    readonly width: ConcreteDim;
    readonly stride: CtcStride;
    // Recognizer output vocab size V (charset length incl. the blank).
    readonly vocab: number;
  };
  readonly charset: string[];
};

// One detect → recognize → reading-order pass over an image.
function runPass(
  engine: PaddleOcrEngine,
  input: ImageBuffer,
  confidenceThreshold: number
): OcrDetection[] {
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
      if (text.length > 0 && conf >= confidenceThreshold) {
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

function refsEqual(a: DimRef, b: DimRef): boolean {
  return a.paramSide === b.paramSide && a.tensorIdx === b.tensorIdx && a.dimIdx === b.dimIdx;
}

// Reads the width↔timesteps relation the recognizer declares, and feeds it back
// into the allowed spec so validateSpec still matches the constraint 1-to-1 and
// rejects any others the model may declare.
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
      'createPaddleOcr: the recognizer must declare a linear runtime constraint relating ' +
        'its input width (input 0, dim 3) to its CTC timesteps (output 0, dim 1); the pipeline ' +
        'needs it to pre-size the probs output.'
    );
  }
  const [pixelsPerStep, offset] = linear.coefficients;
  if (pixelsPerStep <= 0) {
    throw RnExecuTorchError(
      'SCHEMA_MISMATCH',
      `createPaddleOcr: the recognizer's width-per-timestep coefficient must be positive, ` +
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

// Validates the export against the one shape PP-OCRv6 ships: a size-varying
// detector (RGB [1,3,H,W] in, [1,1,H,W] probability map out) and a
// varying-width recognizer (RGB [1,3,H,W] in, [1,T,V] probs out). Both are
// `DynamicDim` on every backend — a range on XNNPACK and Vulkan, an enum on
// CoreML, which has no RangeDim — so one variant covers all three.
function resolveContract(
  model: Model,
  charsetEntries: readonly string[]
): Omit<PaddleOcrEngine, 'model'> {
  const schema = model.schema;
  const stride = readCtcStride(schema);

  const { dims } = validateSpec(schema, {
    ppOcrV6: {
      ...method(
        'detect',
        [f32(1, 3, DynamicDim('detH'), DynamicDim('detW'))],
        [f32(1, 1, DynamicDim('detOutH'), DynamicDim('detOutW'))]
      ),
      ...method(
        'recognize',
        [f32(1, REC_CHANNELS, 'recH', DynamicDim('recW'))],
        [f32(1, DynamicDim('recT'), 'vocab')],
        [constr.linear(REC_WIDTH_REF, REC_TIMESTEPS_REF, stride.pixelsPerStep, stride.offset)]
      ),
    },
  });
  const [recH, vocabSize] = dims.constant('recH', 'vocab');

  const det = {
    h: exportedDim(schema, 'detect', { paramSide: 'input', tensorIdx: 0, dimIdx: 2 }),
    w: exportedDim(schema, 'detect', { paramSide: 'input', tensorIdx: 0, dimIdx: 3 }),
  };
  const width = exportedDim(schema, 'recognize', REC_WIDTH_REF);

  // recognizeCanvas pre-allocates the probs tensor as [1, ctcTimesteps(w), V],
  // so the width the runtime picks must land on the timestep lattice — the
  // domain has to admit at least one such width.
  if (!domainAdmits(width, (value) => onCtcLattice(value, stride))) {
    throw RnExecuTorchError(
      'SCHEMA_MISMATCH',
      `createPaddleOcr: no legal recognizer width yields a whole number of CTC timesteps ` +
        `(width = ${stride.pixelsPerStep} * timesteps + ${stride.offset}), so the probs tensor ` +
        `can't be pre-sized.`
    );
  }

  // CTC lookup: index 0 is the blank, then the model's characters.
  const charset = ['[blank]', ...charsetEntries];
  if (charset.length !== vocabSize) {
    throw RnExecuTorchError(
      'SCHEMA_MISMATCH',
      `createPaddleOcr: charset size (${charset.length}, incl. blank) must match the ` +
        `recognizer output vocab (${vocabSize}).`
    );
  }

  return {
    det,
    rec: { recH, maxW: dimExtent(width)[1], width, stride, vocab: vocabSize },
    charset,
  };
}

// Loads the charset published beside the model. Kept off the JS bundle on
// purpose: the table is ~128 KB, and an app that never runs OCR should not
// carry it.
async function readCharsetFile(charsetPath: string): Promise<readonly string[]> {
  // A read that fails means the file is missing or unreadable — the same
  // re-fetch-the-asset case the model file itself reports as LOAD_FAILED. Only
  // the content being wrong is the caller's argument to fix.
  let raw: string;
  try {
    raw = await RNBlobUtil.fs.readFile(charsetPath, 'utf8');
  } catch (e) {
    throw RnExecuTorchError(
      'LOAD_FAILED',
      `createPaddleOcr: could not read the charset at '${charsetPath}': ${e instanceof Error ? e.message : String(e)}`
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
      `createPaddleOcr: the charset at '${charsetPath}' is not valid JSON: ${e instanceof Error ? e.message : String(e)}`
    );
  }
  if (!Array.isArray(parsed) || parsed.some((entry) => typeof entry !== 'string')) {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
      `createPaddleOcr: the charset at '${charsetPath}' must be a JSON array of strings.`
    );
  }
  return parsed as readonly string[];
}

/**
 * Creates the PP-OCRv6 runner: one pass detects text quads on the whole page,
 * warps each to the recognizer canvas and reads it, returning the lines in
 * reading order.
 * @category Typescript API
 * @param config Model path, charset path, and run options.
 * @param runtime Optional worklet runtime thread.
 * @returns A promise resolving to an object containing recognition and disposal
 * controls.
 * @throws {RnExecuTorchError} With code `SCHEMA_MISMATCH` if the loaded model
 * does not match the PP-OCRv6 detect/recognize contract, or if the charset does
 * not match the recognizer's vocabulary.
 * @throws {RnExecuTorchError} With code `LOAD_FAILED` if the charset file cannot
 * be read, or `INVALID_ARGUMENT` if it does not hold a JSON array of strings.
 */
export async function createPaddleOcr(
  config: PaddleOcrModel,
  runtime?: WorkletRuntime
): Promise<{
  /**
   * Releases all allocated native resources.
   */
  dispose: () => void;

  /**
   * Detects and recognizes every text line in the given image.
   * @param input The input image buffer.
   * @param options Per-call overrides. `confidenceThreshold` replaces the
   * model's `defaultConfidenceThreshold` for this call.
   * @returns A promise resolving to the recognized lines in reading order
   * (leftmost column top to bottom, then the next column).
   */
  recognizeCharacters: (
    input: ImageBuffer,
    options?: { confidenceThreshold?: number }
  ) => Promise<OcrDetection[]>;

  /**
   * Synchronous version of {@link recognizeCharacters} to be executed directly
   * on the caller or worklet thread.
   */
  recognizeCharactersWorklet: (
    input: ImageBuffer,
    options?: { confidenceThreshold?: number }
  ) => OcrDetection[];
}> {
  const { modelPath, charsetPath, modelOpts } = config;
  // Read the charset before loading the model: it is the cheaper failure, and
  // nothing needs disposing if the config is wrong.
  const charsetEntries = await readCharsetFile(charsetPath);
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  // Contract validation can throw; a bad config must not leak the model.
  let engine!: PaddleOcrEngine;
  try {
    engine = { model, ...resolveContract(model, charsetEntries) };
  } catch (e) {
    model.dispose();
    throw e;
  }

  const defaultThreshold = modelOpts.defaultConfidenceThreshold;

  const dispose = () => {
    model.dispose();
  };

  const recognizeCharactersWorklet = (
    input: ImageBuffer,
    options?: { confidenceThreshold?: number }
  ): OcrDetection[] => {
    'worklet';
    return runPass(engine, input, options?.confidenceThreshold ?? defaultThreshold);
  };

  const recognizeCharacters = wrapAsync(recognizeCharactersWorklet, runtime);

  return { recognizeCharacters, recognizeCharactersWorklet, dispose };
}
