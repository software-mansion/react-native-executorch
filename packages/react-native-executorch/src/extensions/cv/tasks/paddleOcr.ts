// PP-OCRv6: a DBNet text detector and an SVTR recognizer fused into one PTE.
// One pass locates every text line on the page, warps each to the recognizer
// canvas and reads it. Worklet source order matters here: a referenced worklet
// must be defined above its callers.

import type { WorkletRuntime } from 'react-native-worklets';
import RNBlobUtil from 'react-native-blob-util';

import { loadModel } from '../../../core/model';
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
} from '../../../core/schema';
import { IMAGENET_NORM } from '../../../constants';

import type { ImageBuffer } from '../image';
import {
  cvtColor,
  toChannelsFirst,
  normalize,
  FORMAT_CHANNELS,
  FORMAT_CONVERSION,
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
import { argmax, gather } from '../../math';
import { extractDbnetTextQuads } from '../utils/paddleOcrUtils';
import { createImagePreprocessor } from './preprocessing';

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
// the recognizer on (x/255 - 0.5)/0.5 over a gray-padded canvas.
const DETECTOR_PREPROCESSOR_OPTS = {
  resizeMode: 'letterbox' as const,
  interpolation: 'area' as const,
  normalizeOpts: IMAGENET_NORM,
  padValue: 0,
};
const RECOGNIZER_PREPROCESSOR_OPTS = {
  padValue: 128, // neutral gray
  normalizeOpts: { alpha: 1 / 127.5, beta: -1.0 },
};

// DBNet decode thresholds, tuned for this checkpoint.
const DBNET_DECODE_OPTS = {
  binThreshold: 0.3,
  boxThreshold: 0.6,
  unclipRatio: 1.5,
  minBoxSide: 3,
  maxCandidates: 1000,
} as const;

// A line at most this factor wider than the recognizer max is squished into it;
// anything wider is split and read piecewise (a hard clamp is unreadable).
const WIDE_SQUISH_TOLERANCE = 1.15;

// SVTR reduces the input width onto the CTC time axis by a plain factor, with no
// trailing crop: W = 8 * T. Asserted against the model through the `linear`
// runtime constraint the spec below declares.
const SVTR_CTC_STRIDE = 8;

// Degenerate-quad guard, in ORIGINAL IMAGE pixels, applied after a quad is
// mapped back from detector space. Distinct from DBNET_DECODE_OPTS.minBoxSide,
// which drops contour candidates in detector-input pixels before the unclip step.
const MIN_RECOGNIZABLE_SIDE = 3;

// ─── Input size resolution ───────────────────────────────────────────────────

type DynamicDimension = Exclude<ConcreteDim, { kind: 'constant' }>;

// The largest size the dimension admits. Resolved once at load time.
function dimMax(dim: DynamicDimension): number {
  return dim.kind === 'range' ? dim.range.max : Math.max(...dim.choices);
}

// The smallest size `dim` admits that is >= `size`, else its largest. Snapping up
// means the model never sees content squished below its natural scale; only the
// domain max can shrink it, and the callers scale down to it first.
function snap(size: number, dim: DynamicDimension): number {
  'worklet';
  switch (dim.kind) {
    case 'range': {
      const { min, max, step } = dim.range;
      const eps = 1e-9; // prevents floating-point drift from falsely pushing Math.ceil up
      const k = Math.ceil((size - min) / step - eps);
      return Math.max(min, Math.min(min + k * step, max));
    }
    case 'enum': {
      const above = dim.choices.filter((choice) => choice >= size);
      return above.length > 0 ? Math.min(...above) : Math.max(...dim.choices);
    }
  }
}

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

// ─── CTC decode ──────────────────────────────────────────────────────────────

// Greedy-CTC decode of `[1,T,V]` probs: take the per-timestep argmax and the
// probability at it, then drop the blank (index 0) and consecutive repeats and
// mean the confidence over what is left.
function greedyCtcDecode(
  probs: Tensor,
  charset: readonly string[]
): { text: string; conf: number } {
  'worklet';
  const timesteps = probs.shape[1]!;
  const tIndices = tensor('int32', [1, timesteps, 1]);
  const tMaxima = tensor('float32', [1, timesteps, 1]);
  let indices: Int32Array;
  let maxima: Float32Array;
  try {
    // Both read from `probs`: argmax writes the indices, gather then reads the
    // value at each of them. Chaining would feed the indices back in as `src`.
    probs.through(argmax, tIndices);
    probs.through(gather, tIndices, tMaxima);
    indices = tIndices.getData(new Int32Array(timesteps));
    maxima = tMaxima.getData(new Float32Array(timesteps));
  } finally {
    tIndices.dispose();
    tMaxima.dispose();
  }

  let text = '';
  let last = -1;
  let probabilitySum = 0;
  let charCounter = 0;
  for (let t = 0; t < timesteps; t++) {
    const idx = indices[t]!;
    if (idx >= 1) {
      probabilitySum += maxima[t]!;
      charCounter++;
      if (idx !== last && idx < charset.length) {
        text += charset[idx]!;
      }
    }
    last = idx;
  }
  return { text, conf: charCounter === 0 ? 0 : probabilitySum / charCounter };
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
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  // Both methods are `DynamicDim` on every backend — a range on XNNPACK and
  // Vulkan, an enum on CoreML, which has no RangeDim — so one variant covers
  // all three.
  const { dims } = validateSpec(model.schema, {
    ppOcrV6: {
      ...method(
        'detect',
        [f32(1, 3, DynamicDim('detH'), DynamicDim('detW'))],
        [f32(1, 1, DynamicDim('detOutH'), DynamicDim('detOutW'))]
      ),
      ...method(
        'recognize',
        [f32(1, 3, 'recH', DynamicDim('recW'))],
        [f32(1, DynamicDim('recT'), 'vocab')],
        [
          constr.linear(
            { paramSide: 'input', tensorIdx: 0, dimIdx: 3 },
            { paramSide: 'output', tensorIdx: 0, dimIdx: 1 },
            SVTR_CTC_STRIDE
          ),
        ]
      ),
    },
  });

  const [detHDim, detWDim, recWDim] = dims.dynamic('detH', 'detW', 'recW');
  const [recH, vocabSize] = dims.constant('recH', 'vocab');
  const [detHMax, detWMax, recWMax] = [dimMax(detHDim), dimMax(detWDim), dimMax(recWDim)];

  // Kept off the JS bundle on purpose: the table is ~128 KB, and an app that
  // never runs OCR should not carry it. CTC lookup: index 0 is the blank, then
  // the model's characters.
  const charsetString = await RNBlobUtil.fs.readFile(charsetPath, 'utf8');
  const charset: readonly string[] = ['[blank]', ...JSON.parse(charsetString)];
  if (charset.length !== vocabSize) {
    throw RnExecuTorchError(
      'SCHEMA_MISMATCH',
      `createPaddleOcr: charset size (${charset.length}, incl. blank) must match the ` +
        `recognizer output vocab (${vocabSize}).`
    );
  }

  const dispose = () => model.dispose();

  const recognizeCharactersWorklet = (
    input: ImageBuffer,
    options?: { confidenceThreshold?: number }
  ): OcrDetection[] => {
    'worklet';
    const confidenceThreshold =
      options?.confidenceThreshold ?? modelOpts.defaultConfidenceThreshold;

    const [H, W] = [input.height, input.width];
    const numChannels = FORMAT_CHANNELS[input.format];
    const colorCode = FORMAT_CONVERSION[input.format].rgb;

    // Scale the page down to fit the detector before snapping, so a wide page
    // keeps its aspect ratio instead of paying for padding on the short side.
    const scale = Math.min(1, detHMax / H, detWMax / W);
    const [detH, detW] = [
      snap(Math.round(H * scale), detHDim),
      snap(Math.round(W * scale), detWDim),
    ];

    // 1. Detect the quads holding text.
    let quads: Quad[];
    const detPreprocessor = createImagePreprocessor(DETECTOR_PREPROCESSOR_OPTS, [1, 3, detH, detW]);
    // DBNet emits one full-resolution probability map, [1, 1, H, W].
    const tDetProbas = tensor('float32', [1, 1, detH, detW]);
    try {
      const tDetInput = detPreprocessor.process(input);
      model.execute('detect', [tDetInput], [tDetProbas]);

      quads = extractDbnetTextQuads(tDetProbas, DBNET_DECODE_OPTS)
        .map((q) => orderQuad(scaleQuad(q, { from: { width: detW, height: detH }, to: input })))
        .filter((q) => Object.values(quadSize(q)).every((s) => s >= MIN_RECOGNIZABLE_SIDE));
    } finally {
      tDetProbas.dispose();
      detPreprocessor.dispose();
    }

    // 2. Read the text inside each quad.
    const detections: OcrDetection[] = [];
    const tImage = tensor('uint8', [H, W, numChannels], input.data);
    try {
      for (const quad of quads) {
        const size = quadSize(quad);
        const aspectW = Math.max(1, Math.round((recH * size.width) / size.height));

        // Known limitation: segments abut with no overlap, so a glyph straddling
        // a cut can be mangled at the seam. Acceptable for now, since a line this
        // wide is the rare case.
        const splits =
          aspectW > recWMax * WIDE_SQUISH_TOLERANCE
            ? splitWideQuad(quad, Math.ceil(aspectW / recWMax))
            : [quad];

        let text = '';
        let weightedConf = 0;

        for (const splitQuad of splits) {
          const splitSize = quadSize(splitQuad);
          const splitAspectW = Math.max(1, Math.round((recH * splitSize.width) / splitSize.height));
          const recW = snap(splitAspectW, recWDim);

          const auxTensors = [
            tensor('uint8', [recH, recW, numChannels]), // tQuad
            tensor('uint8', [recH, recW, 3]), // tColor
            tensor('uint8', [3, recH, recW]), // tChanFirst
            tensor('float32', [3, recH, recW]), // tNorm
            tensor('float32', [1, 3, recH, recW]), // tRecInput
            // Every width the domain admits is a multiple of SVTR_CTC_STRIDE, so
            // the dynamically-sized probs output can be pre-allocated exactly.
            tensor('float32', [1, recW / SVTR_CTC_STRIDE, vocabSize]), // tRecProbas
          ] as const;
          const [tQuad, tColor, tChanFirst, tNorm, tRecInput, tRecProbas] = auxTensors;

          try {
            tImage
              .through(rectifyQuad, tQuad, splitQuad, {
                contentWidth: Math.min(recWMax, splitAspectW),
                padValue: RECOGNIZER_PREPROCESSOR_OPTS.padValue,
              })
              .throughIf(colorCode !== null, cvtColor, tColor, colorCode!)
              .through(toChannelsFirst, tChanFirst)
              .through(normalize, tNorm, RECOGNIZER_PREPROCESSOR_OPTS.normalizeOpts)
              .copyTo(tRecInput);

            model.execute('recognize', [tRecInput], [tRecProbas]);

            const split = greedyCtcDecode(tRecProbas, charset);
            text += split.text;
            weightedConf += split.conf * split.text.length;
          } finally {
            auxTensors.forEach((t) => t.dispose());
          }
        }

        const confidence = text.length === 0 ? 0 : weightedConf / text.length;
        if (text.length > 0 && confidence >= confidenceThreshold) {
          detections.push({ text, confidence, quad });
        }
      }
    } finally {
      tImage.dispose();
    }

    return orderByReadingOrder(detections);
  };

  const recognizeCharacters = wrapAsync(recognizeCharactersWorklet, runtime);

  return { recognizeCharacters, recognizeCharactersWorklet, dispose };
}
