import type { Point } from '../../ops/points';
import { boundsOfPoints } from '../../ops/quad';

/**
 * The static input-size buckets a bucketed OCR model exposes. Each model ships
 * per-size detect (`detect_<S>`, square `S×S` input) and recognize
 * (`recognize_<W>`, fixed height, width `W`) methods; the pipeline snaps each
 * input to the nearest bucket and calls the matching method. Both lists must be
 * ascending.
 * @category Types
 */
export type Buckets = {
  readonly detect: readonly number[];
  readonly recognize: readonly number[];
};

// A size within this fraction above the next-lower bucket snaps DOWN to it rather
// than up, so a marginal overflow (e.g. 641 px against a 640 bucket) doesn't jump
// to the next, much larger and slower, bucket. Kept small: a larger downscale
// loses detail the model was trained to see.
const BUCKET_SNAP_TOLERANCE = 0.1;

/**
 * Selects the smallest bucket that fits `size`, but snaps down to the next-lower
 * bucket when `size` exceeds it by no more than the snap tolerance; oversized
 * inputs clamp to the largest bucket. Detector callers pass the image's longest
 * side (selecting `detect_<S>`); recognizer callers pass the desired crop
 * content width (selecting `recognize_<W>`).
 * @category Typescript API
 * @param size The size to fit, in pixels.
 * @param buckets The model's ascending bucket sizes.
 * @returns The selected bucket size.
 */
export function snapBucket(size: number, buckets: readonly number[]): number {
  'worklet';
  for (let i = 0; i < buckets.length; i++) {
    if (buckets[i]! >= size) {
      const lower = i > 0 ? buckets[i - 1]! : 0;
      return lower > 0 && size <= lower * (1 + BUCKET_SNAP_TOLERANCE) ? lower : buckets[i]!;
    }
  }
  return buckets[buckets.length - 1]!;
}

/**
 * Computes the content width (px) of a recognizer crop: the region resized to the
 * recognizer height keeping its aspect ratio, clamped to the bucket width.
 * @category Typescript API
 * @param regionWidth The region's natural width.
 * @param regionHeight The region's natural height.
 * @param recognizerHeight The recognizer input height.
 * @param bucketWidth The recognizer input (canvas) width.
 * @returns The clamped content width in pixels.
 */
export function contentWidthFor(
  regionWidth: number,
  regionHeight: number,
  recognizerHeight: number,
  bucketWidth: number
): number {
  'worklet';
  const width = Math.round((recognizerHeight * regionWidth) / Math.max(1, regionHeight));
  return Math.max(1, Math.min(width, bucketWidth));
}

// A gutter must be at least this fraction of the content width to split columns;
// two boxes share a line when their vertical extents overlap by at least this
// fraction of the shorter box's height.
const COLUMN_GAP_FRACTION = 0.06;
const LINE_OVERLAP_FRACTION = 0.3;

/**
 * Reorders items carrying a `quad` into human reading order: multi-column inputs
 * read column-by-column, single-column inputs line-by-line, and boxes within a
 * line left-to-right. Detectors emit boxes in an arbitrary order, so detections
 * and assembled blocks are ordered through this.
 * @category Typescript API
 * @param items The items to reorder, each carrying a `quad`.
 * @returns The items in reading order.
 */
export function orderByReadingOrder<T extends { quad: readonly Point[] }>(items: T[]): T[] {
  'worklet';
  const count = items.length;
  if (count <= 1) {
    return items;
  }

  // 1. Axis-aligned bounds per quad, plus the content x-range: a column gutter
  //    must be at least COLUMN_GAP_FRACTION of that range to count.
  const boxes = items.map((it) => boundsOfPoints(it.quad, 'xyxy'));
  let minX = Infinity;
  let maxX = -Infinity;
  for (const box of boxes) {
    if (box.xmin < minX) minX = box.xmin;
    if (box.xmax > maxX) maxX = box.xmax;
  }
  const minGap = COLUMN_GAP_FRACTION * Math.max(1, maxX - minX);

  // 2. Find column gutters with an x-coverage sweep over the box edges: while
  //    inside any box the coverage counter is > 0; a zero-coverage span wider
  //    than minGap is a gutter, and its midpoint becomes a column cut.
  const edges: { x: number; delta: number }[] = [];
  for (const box of boxes) {
    edges.push({ x: box.xmin, delta: 1 });
    edges.push({ x: box.xmax, delta: -1 });
  }
  // At equal x, open (+1) before close (-1) so touching boxes don't open a gutter.
  edges.sort((a, b) => a.x - b.x || b.delta - a.delta);
  const cuts: number[] = [];
  let coverage = 0;
  let gutterStart = 0;
  for (const edge of edges) {
    const before = coverage;
    coverage += edge.delta;
    if (before > 0 && coverage === 0) {
      gutterStart = edge.x;
    } else if (before === 0 && coverage > 0 && edge.x - gutterStart >= minGap) {
      cuts.push((gutterStart + edge.x) / 2);
    }
  }

  // 3. Assign each box to a column: count how many (ascending) cuts its
  //    center-x lies to the right of.
  const columns: number[][] = Array.from({ length: cuts.length + 1 }, () => []);
  for (let i = 0; i < count; i++) {
    const centerX = (boxes[i]!.xmin + boxes[i]!.xmax) / 2;
    let column = 0;
    for (const cut of cuts) {
      if (centerX > cut) column++;
    }
    columns[column]!.push(i);
  }

  // 4. Within each (left-to-right) column: group boxes into lines by vertical
  //    overlap (≥ LINE_OVERLAP_FRACTION of the shorter height joins a line),
  //    order lines top-to-bottom and boxes within a line left-to-right.
  const order: number[] = [];
  for (const column of columns) {
    column.sort((a, b) => boxes[a]!.ymin - boxes[b]!.ymin);
    const lines: { items: number[]; ymin: number; ymax: number }[] = [];
    for (const i of column) {
      const box = boxes[i]!;
      let placed = false;
      for (const line of lines) {
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

// A box wider than this multiple of its height is a horizontal line, never a
// stacked-column glyph. A box joins a column when its x-span overlaps the
// column's by COLUMN_X_OVERLAP of the narrower width and the y-gap is within
// COLUMN_Y_GAP of its height.
const COLUMN_GLYPH_ASPECT = 1.6;
const COLUMN_X_OVERLAP = 0.25;
const COLUMN_Y_GAP = 2.5;

/**
 * Clusters glyph-like, x-aligned, vertically-stacked boxes into columns; wide
 * lines and isolated boxes are returned as `singles` to read normally. This lets
 * a vertical-text pass add column reading without disturbing horizontal reads.
 * @category Typescript API
 * @param quads The detected text quads (ordered TL,TR,BR,BL).
 * @returns The detected `columns` (each a top-to-bottom list of quads) and the
 * leftover `singles` (horizontal lines / isolated boxes).
 */
export function groupVerticalColumns(quads: readonly (readonly Point[])[]): {
  columns: Point[][][];
  singles: Point[][];
} {
  'worklet';
  type Candidate = {
    quad: Point[];
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
    width: number;
    height: number;
  };
  const candidates: Candidate[] = [];
  const singles: Point[][] = [];
  for (const q of quads) {
    const { xmin, ymin, xmax, ymax } = boundsOfPoints(q, 'xyxy');
    const width = xmax - xmin;
    const height = ymax - ymin;
    if (width > height * COLUMN_GLYPH_ASPECT) {
      singles.push(q as Point[]);
    } else {
      candidates.push({ quad: q as Point[], xmin, xmax, ymin, ymax, width, height });
    }
  }
  // Grow each column top-to-bottom from its current bottom box, checking alignment
  // against the column's accumulated x-range so a narrow glyph between wider ones
  // doesn't break the run.
  candidates.sort((a, b) => a.ymin - b.ymin);
  type Column = { boxes: Candidate[]; xmin: number; xmax: number; bottom: number };
  const columns: Column[] = [];
  for (const box of candidates) {
    let placed = false;
    for (const column of columns) {
      const overlap = Math.min(box.xmax, column.xmax) - Math.max(box.xmin, column.xmin);
      const aligned = overlap > COLUMN_X_OVERLAP * Math.min(box.width, column.xmax - column.xmin);
      const gap = box.ymin - column.bottom;
      if (aligned && gap < COLUMN_Y_GAP * box.height && gap > -0.5 * box.height) {
        column.boxes.push(box);
        column.xmin = Math.min(column.xmin, box.xmin);
        column.xmax = Math.max(column.xmax, box.xmax);
        column.bottom = box.ymax;
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push({ boxes: [box], xmin: box.xmin, xmax: box.xmax, bottom: box.ymax });
    }
  }
  const grouped: Point[][][] = [];
  for (const column of columns) {
    if (column.boxes.length >= 2) {
      grouped.push(column.boxes.map((b) => b.quad));
    } else {
      singles.push(column.boxes[0]!.quad);
    }
  }
  return { columns: grouped, singles };
}

/**
 * Collapses a greedy-CTC argmax path into recognized text and a confidence score:
 * reserved low indices (the CTC blank, `< numSpecials`) and consecutive repeats
 * are dropped from the text, and the confidence is the mean value over the
 * non-reserved timesteps.
 * @category Typescript API
 * @param indices The per-timestep argmax indices.
 * @param values The per-timestep max values (probabilities).
 * @param charset The charset lookup, reserved tokens at the front.
 * @param numSpecials Number of reserved low indices (default 1 = CTC blank).
 * @returns The decoded `text` and its `confidence` in `[0, 1]`.
 */
export function ctcCollapse(
  indices: number[],
  values: number[],
  charset: readonly string[],
  numSpecials = 1
): { text: string; confidence: number } {
  'worklet';
  let text = '';
  let last = -1;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < indices.length; i++) {
    const idx = indices[i]!;
    if (idx >= numSpecials) {
      sum += values[i]!;
      count++;
      if (idx !== last && idx < charset.length) {
        text += charset[idx]!;
      }
    }
    last = idx;
  }
  return { text, confidence: count === 0 ? 0 : sum / count };
}
