import type { Quad } from '../ops/image';
import { scalePoint, clamp, type Point } from '../ops/points';

/**
 * Worklet-safe millisecond clock for in-pipeline profiling. Prefers
 * `performance.now()` (sub-ms) and falls back to `Date.now()`.
 * @category Typescript API
 * @returns The current time in milliseconds.
 */
export function nowMs(): number {
  'worklet';
  const perf = (globalThis as { performance?: { now?: () => number } }).performance;
  return perf?.now ? perf.now() : Date.now();
}

/**
 * The static input-size buckets a bucketed OCR model exposes. Each PTE ships
 * per-size methods `detect_<S>` (square `S×S` detector input) and
 * `recognize_<W>` (fixed recognizer height, width `W`). The client snaps each
 * input to the closest bucket and calls the matching method. Mirrors each
 * model's `config.json` `buckets` (today hardcoded in `models.ts`). Both lists
 * must be ascending.
 * @category Types
 */
export type Buckets = {
  /** Square detector input sides (e.g. `[640, 960, 1280]`), ascending. */
  readonly detect: readonly number[];
  /** Recognizer input widths (e.g. `[160, 320, 480, 640]`), ascending. */
  readonly recognize: readonly number[];
};

/**
 * Snaps an image's longest side *up* to the smallest detector bucket that doesn't
 * downscale it (clamped to the largest bucket), and returns that square side.
 * Rounding up, not nearest, is deliberate: downscaling below the detector's
 * resolution drops text detail and garbles dense lines.
 * @category Typescript API
 * @param imgW Original image width.
 * @param imgH Original image height.
 * @param buckets The ascending detector side buckets.
 * @returns The selected square side `S` (call `detect_${S}`).
 */
export function snapDetectBucket(imgW: number, imgH: number, buckets: readonly number[]): number {
  'worklet';
  const longest = Math.max(imgW, imgH);
  for (const s of buckets) {
    if (s >= longest) {
      return s;
    }
  }
  return buckets[buckets.length - 1]!;
}

/**
 * Snaps a desired recognizer content width up to the smallest bucket that fits
 * it (avoiding horizontal glyph compression), clamped to the largest bucket.
 * @category Typescript API
 * @param desiredW The crop/feature content width at the recognizer height.
 * @param buckets The ascending recognizer width buckets.
 * @returns The selected width `W` (call `recognize_${W}`).
 */
export function snapRecognizeBucket(desiredW: number, buckets: readonly number[]): number {
  'worklet';
  for (const w of buckets) {
    if (w >= desiredW) {
      return w;
    }
  }
  return buckets[buckets.length - 1]!;
}

/**
 * Maps a detector-space quad back into original image pixel coordinates
 * (reversing the aspect-preserving letterbox), clamping to the image bounds.
 * @category Typescript API
 * @param quad The detector-space quad.
 * @param detW The detector input width the quad is expressed in.
 * @param detH The detector input height the quad is expressed in.
 * @param origW Original image width.
 * @param origH Original image height.
 * @returns The four quad corners in original image pixels.
 */
export function mapQuadToImage(
  quad: Quad,
  detW: number,
  detH: number,
  origW: number,
  origH: number
): Point[] {
  'worklet';
  return quad.points.map((p) => {
    const m = scalePoint(p, {
      from: { width: detW, height: detH },
      to: { width: origW, height: origH },
      resizeMode: 'letterbox',
    });
    return { x: clamp(m.x, 0, origW), y: clamp(m.y, 0, origH) };
  });
}

/**
 * Orders four points as TL, TR, BR, BL using x±y extremes (pyimagesearch
 * convention).
 * @category Typescript API
 * @param pts The four unordered quad corners.
 * @returns The corners ordered TL, TR, BR, BL.
 */
export function orderQuad(pts: readonly Point[]): Point[] {
  'worklet';
  // The x±y-extreme ordering below assumes exactly four corners; for any other
  // count return a copy unchanged rather than indexing out of range.
  if (pts.length !== 4) {
    return [...pts];
  }
  let tl = 0;
  let tr = 0;
  let br = 0;
  let bl = 0;
  let minSum = pts[0]!.x + pts[0]!.y;
  let maxSum = minSum;
  let minDiff = pts[0]!.y - pts[0]!.x;
  let maxDiff = minDiff;
  for (let i = 1; i < 4; i++) {
    const s = pts[i]!.x + pts[i]!.y;
    const d = pts[i]!.y - pts[i]!.x;
    if (s < minSum) {
      minSum = s;
      tl = i;
    }
    if (s > maxSum) {
      maxSum = s;
      br = i;
    }
    if (d < minDiff) {
      minDiff = d;
      tr = i;
    }
    if (d > maxDiff) {
      maxDiff = d;
      bl = i;
    }
  }
  return [pts[tl]!, pts[tr]!, pts[br]!, pts[bl]!];
}

const distance = (a: Point, b: Point): number => {
  'worklet';
  return Math.hypot(b.x - a.x, b.y - a.y);
};

/**
 * The natural width/height (in pixels) of an ordered TL,TR,BR,BL quad.
 * @category Typescript API
 * @param ordered The quad corners ordered TL, TR, BR, BL.
 * @returns The quad's width and height in pixels.
 */
export function quadSize(ordered: readonly Point[]): { width: number; height: number } {
  'worklet';
  const [tl, tr, br, bl] = ordered as [Point, Point, Point, Point];
  const width = Math.max(distance(tl, tr), distance(bl, br));
  const height = Math.max(distance(tl, bl), distance(tr, br));
  return { width, height };
}

// Reading-order tuning. A vertical gutter crossed by no box must be at least this
// fraction of the content width to separate columns; two boxes share a text line
// when their vertical extents overlap by at least this fraction of the shorter
// box's height. Stable across models — not worth exposing.
const READING_COL_GAP_FRAC = 0.06;
const READING_ROW_OVERLAP_FRAC = 0.3;

type ReadingBox = { xmin: number; ymin: number; xmax: number; ymax: number };

// Axis-aligned bounds of a quad. Defined before readingOrderIndices so the worklet
// plugin captures it (a referenced worklet must precede its caller in source order).
function bboxOfQuad(quad: readonly Point[]): ReadingBox {
  'worklet';
  if (quad.length === 0) {
    return { xmin: 0, ymin: 0, xmax: 0, ymax: 0 };
  }
  let xmin = Infinity;
  let ymin = Infinity;
  let xmax = -Infinity;
  let ymax = -Infinity;
  for (const p of quad) {
    if (p.x < xmin) xmin = p.x;
    if (p.y < ymin) ymin = p.y;
    if (p.x > xmax) xmax = p.x;
    if (p.y > ymax) ymax = p.y;
  }
  return { xmin, ymin, xmax, ymax };
}

/**
 * Returns the indices of `quads` in human reading order. Detects vertical column
 * gutters with an x-coverage sweep — a band crossed by no box and wider than
 * {@link READING_COL_GAP_FRAC} of the content width splits columns (within-line
 * word gaps don't, because other lines cover that x); within each column it groups
 * boxes into lines by vertical overlap, orders lines top-to-bottom and the boxes in
 * a line left-to-right, and reads columns left-to-right. Single-line / single-column
 * inputs collapse to the obvious order. The detector emits boxes in an arbitrary
 * order, so callers reorder their detections/lines through this.
 * @category Typescript API
 * @param quads The detected text quads (any corner order).
 * @returns Indices into `quads`, in reading order.
 */
export function readingOrderIndices(quads: readonly (readonly Point[])[]): number[] {
  'worklet';
  const n = quads.length;
  if (n <= 1) {
    return n === 1 ? [0] : [];
  }
  const boxes = quads.map((q) => bboxOfQuad(q));
  let X0 = Infinity;
  let X1 = -Infinity;
  for (const b of boxes) {
    if (b.xmin < X0) X0 = b.xmin;
    if (b.xmax > X1) X1 = b.xmax;
  }
  const minGap = READING_COL_GAP_FRAC * Math.max(1, X1 - X0);

  // Column detection: sweep box x-edges; an internal span where coverage drops to
  // zero (no box at that x across any line) wider than minGap is a column gutter.
  const edges: { x: number; d: number }[] = [];
  for (const b of boxes) {
    edges.push({ x: b.xmin, d: 1 });
    edges.push({ x: b.xmax, d: -1 });
  }
  // At equal x, open (+1) before close (-1) so touching boxes don't open a gutter.
  edges.sort((a, b) => a.x - b.x || b.d - a.d);
  const cuts: number[] = [];
  let active = 0;
  let gutterStart = 0;
  for (const e of edges) {
    const before = active;
    active += e.d;
    if (before > 0 && active === 0) {
      gutterStart = e.x;
    } else if (before === 0 && active > 0 && e.x - gutterStart >= minGap) {
      cuts.push((gutterStart + e.x) / 2);
    }
  }

  // Bucket boxes into columns by center-x relative to the (ascending) cut lines.
  const numCols = cuts.length + 1;
  const columns: number[][] = [];
  for (let c = 0; c < numCols; c++) {
    columns.push([]);
  }
  for (let i = 0; i < n; i++) {
    const cx = (boxes[i]!.xmin + boxes[i]!.xmax) / 2;
    let c = 0;
    for (const cut of cuts) {
      if (cx > cut) c++;
    }
    columns[c]!.push(i);
  }

  // Within each column: group boxes into lines by vertical overlap, order lines
  // top-to-bottom and boxes within a line left-to-right.
  const out: number[] = [];
  for (const col of columns) {
    col.sort((a, b) => boxes[a]!.ymin - boxes[b]!.ymin);
    const rows: { items: number[]; ymin: number; ymax: number }[] = [];
    for (const i of col) {
      const b = boxes[i]!;
      let placed = false;
      for (const row of rows) {
        const overlap = Math.min(row.ymax, b.ymax) - Math.max(row.ymin, b.ymin);
        const minH = Math.min(row.ymax - row.ymin, b.ymax - b.ymin);
        if (overlap >= READING_ROW_OVERLAP_FRAC * Math.max(1, minH)) {
          row.items.push(i);
          row.ymin = Math.min(row.ymin, b.ymin);
          row.ymax = Math.max(row.ymax, b.ymax);
          placed = true;
          break;
        }
      }
      if (!placed) {
        rows.push({ items: [i], ymin: b.ymin, ymax: b.ymax });
      }
    }
    rows.sort((a, b) => a.ymin - b.ymin);
    const cx = (i: number): number => boxes[i]!.xmin + boxes[i]!.xmax;
    for (const row of rows) {
      row.items.sort((a, b) => cx(a) - cx(b));
      for (const i of row.items) {
        out.push(i);
      }
    }
  }
  return out;
}

/**
 * Resolves the content width (px) of a recognizer crop: the quad resized to the
 * recognizer height keeping aspect, clamped to the model's bucket width.
 * @category Typescript API
 * @param quadW The quad's natural width.
 * @param quadH The quad's natural height.
 * @param recHeight The recognizer input height.
 * @param bucketWidth The recognizer input (canvas) width.
 * @returns The clamped content width in pixels.
 */
export function contentWidthFor(
  quadW: number,
  quadH: number,
  recHeight: number,
  bucketWidth: number
): number {
  'worklet';
  const w = Math.round((recHeight * quadW) / Math.max(1, quadH));
  return clamp(w, 1, bucketWidth);
}

/**
 * Flattens an ordered TL,TR,BR,BL quad into the 8-number `[x0,y0,..,x3,y3]`
 * array expected by `warpQuad`.
 * @category Typescript API
 * @param corners The four quad corners (TL, TR, BR, BL).
 * @returns The eight coordinates `[x0,y0,x1,y1,x2,y2,x3,y3]`.
 */
export function flattenQuad(corners: readonly Point[]): number[] {
  'worklet';
  // prettier-ignore
  return [
    corners[0]!.x, corners[0]!.y, corners[1]!.x, corners[1]!.y,
    corners[2]!.x, corners[2]!.y, corners[3]!.x, corners[3]!.y,
  ];
}

/**
 * Builds a CTC charset array from a charset string. The first `numSpecials`
 * indices are reserved special tokens (the CTC blank for CRNN/SVTR); subsequent
 * entries are the codepoints of `charset` (UTF-8 aware via `Array.from`), so
 * `charset[id]` decodes logit index `id`.
 * @category Typescript API
 * @param charset The ordered character set string.
 * @param numSpecials Number of reserved low indices (default 1 = CTC blank).
 * @returns The charset array with `numSpecials` placeholders at the front.
 */
export function buildCharset(charset: string | readonly string[], numSpecials = 1): string[] {
  'worklet';
  const specials: string[] = [];
  for (let i = 0; i < numSpecials; i++) {
    specials.push(`[special${i}]`);
  }
  // A string charset is one codepoint per index; an array charset is taken
  // verbatim (its entries may be multi-codepoint, e.g. ligatures or combining
  // marks, which `Array.from` would otherwise split).
  const chars = typeof charset === 'string' ? Array.from(charset) : charset;
  return [...specials, ...chars];
}

/**
 * Greedy CTC decode: skip the reserved special/blank indices (`< numSpecials`)
 * and consecutive repeats, mapping indices to charset entries.
 * @category Typescript API
 * @param indices The per-timestep argmax indices.
 * @param charset The charset array (specials/blank at the front).
 * @param numSpecials Number of reserved low indices to drop (default 1).
 * @returns The decoded text.
 */
export function decodeGreedy(indices: number[], charset: string[], numSpecials = 1): string {
  'worklet';
  let text = '';
  let last = -1;
  for (const idx of indices) {
    if (idx >= numSpecials && idx !== last && idx < charset.length) {
      text += charset[idx]!;
    }
    last = idx;
  }
  return text;
}

/**
 * CTC confidence: the mean of the non-special per-timestep max probabilities
 * (the unified contract softmaxes both heads, so this is comparable across
 * models). Skips the reserved indices (`< numSpecials`).
 * @category Typescript API
 * @param values The per-timestep max probabilities.
 * @param indices The per-timestep argmax indices.
 * @param numSpecials Number of reserved low indices to skip (default 1).
 * @returns The aggregate confidence in `[0, 1]`.
 */
export function ctcConfidence(values: number[], indices: number[], numSpecials = 1): number {
  'worklet';
  let sum = 0;
  let count = 0;
  for (let i = 0; i < indices.length; i++) {
    if (indices[i]! >= numSpecials) {
      sum += values[i]!;
      count++;
    }
  }
  return count === 0 ? 0 : sum / count;
}
