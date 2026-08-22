import { RnExecuTorchError } from '../../../core/error';
import { distance, interpolatePoint, scalePoint, type Point } from './points';
import type { BoundingBox, BoxFormat } from './boxes';

/**
 * An oriented quadrilateral in pixel space: exactly four corners, ordered
 * top-left, top-right, bottom-right, bottom-left. Orientation lives in the
 * corners themselves. Use {@link orderQuad} to put unordered corners in that
 * order; every other helper here assumes it.
 * @category Types
 */
export type Quad = readonly [Point, Point, Point, Point];

/**
 * Computes the axis-aligned bounding box enclosing a set of points, in the
 * requested box format. Returns a zero box for empty input.
 * @category Typescript API
 * @typeParam F Bounding box coordinate format.
 * @param points The points to enclose.
 * @param format The coordinate format of the returned box.
 * @returns The enclosing {@link BoundingBox} in `format`.
 */
export function boundsOfPoints<F extends BoxFormat>(
  points: readonly Point[],
  format: F
): BoundingBox<F> {
  'worklet';
  let xmin = Infinity;
  let ymin = Infinity;
  let xmax = -Infinity;
  let ymax = -Infinity;
  for (const p of points) {
    if (p.x < xmin) xmin = p.x;
    if (p.y < ymin) ymin = p.y;
    if (p.x > xmax) xmax = p.x;
    if (p.y > ymax) ymax = p.y;
  }
  if (points.length === 0) {
    xmin = ymin = xmax = ymax = 0;
  }
  switch (format) {
    case 'xyxy':
      return { format: 'xyxy', xmin, ymin, xmax, ymax } as BoundingBox<F>;
    case 'xywh':
      return { format: 'xywh', xmin, ymin, w: xmax - xmin, h: ymax - ymin } as BoundingBox<F>;
    case 'cxcywh':
      return {
        format: 'cxcywh',
        cx: (xmin + xmax) / 2,
        cy: (ymin + ymax) / 2,
        w: xmax - xmin,
        h: ymax - ymin,
      } as BoundingBox<F>;
    default:
      throw RnExecuTorchError(
        'INVALID_ARGUMENT',
        `boundsOfPoints: unsupported box format '${format}'.`
      );
  }
}

/**
 * Reorders a quad's corners into the top-left, top-right, bottom-right,
 * bottom-left order the rest of this module assumes, using their
 * coordinate-sum and coordinate-difference extremes.
 * @category Typescript API
 * @param quad The quad whose corners may be in any order.
 * @returns The same corners, ordered TL, TR, BR, BL.
 */
export function orderQuad(quad: Quad): Quad {
  'worklet';
  // TL/BR are the corners with the min/max coordinate sum; TR/BL the min/max
  // difference (y − x). indexOfMin/Max break ties on the lowest index.
  const sum = quad.map((p) => p.x + p.y);
  const diff = quad.map((p) => p.y - p.x);
  const indexOfMin = (a: number[]) => a.indexOf(Math.min(...a));
  const indexOfMax = (a: number[]) => a.indexOf(Math.max(...a));
  const corners = [indexOfMin(sum), indexOfMin(diff), indexOfMax(sum), indexOfMax(diff)]; // TL, TR, BR, BL
  // Degenerate quads (duplicate or collinear corners) can map two roles to the
  // same point; the heuristic is meaningless there, so return the corners
  // unchanged and let the resulting near-zero-size box be dropped downstream.
  if (new Set(corners).size !== 4) {
    return quad;
  }
  return [quad[corners[0]!]!, quad[corners[1]!]!, quad[corners[2]!]!, quad[corners[3]!]!];
}

/**
 * Computes the width and height (in pixels) of an ordered TL,TR,BR,BL quad, taking
 * the longer of each pair of opposite sides.
 * @category Typescript API
 * @param ordered The quad corners ordered TL, TR, BR, BL.
 * @returns The quad's width and height in pixels.
 */
export function quadSize(ordered: Quad): { width: number; height: number } {
  'worklet';
  const [tl, tr, br, bl] = ordered;
  const width = Math.max(distance(tl, tr), distance(bl, br));
  const height = Math.max(distance(tl, bl), distance(tr, br));
  return { width, height };
}

/**
 * Maps a quad expressed in a resized (letterboxed) frame back to the original
 * image frame, clamping the result to the image bounds.
 * @category Typescript API
 * @param quad The quad in the resized frame.
 * @param from The size of the resized frame the quad is expressed in.
 * @param to The size of the original image.
 * @returns The four corners in original image pixels.
 */
export function mapQuadToImage(
  quad: Quad,
  from: { readonly width: number; readonly height: number },
  to: { readonly width: number; readonly height: number }
): Quad {
  'worklet';
  const map = (p: Point): Point => {
    'worklet';
    const m = scalePoint(p, { from, to, resizeMode: 'letterbox' });
    return { x: Math.max(0, Math.min(m.x, to.width)), y: Math.max(0, Math.min(m.y, to.height)) };
  };
  return [map(quad[0]), map(quad[1]), map(quad[2]), map(quad[3])];
}

/**
 * Splits an ordered TL,TR,BR,BL quad into `parts` equal horizontal segments
 * (each an ordered quad), left to right. `parts <= 1` returns the quad
 * unchanged.
 * @category Typescript API
 * @param ordered The quad corners ordered TL, TR, BR, BL.
 * @param parts The number of equal horizontal segments to split into.
 * @returns The segments as ordered TL,TR,BR,BL quads, left to right.
 */
export function splitWideQuad(ordered: Quad, parts: number): Quad[] {
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

/**
 * Builds oriented quads from a detector's flat output array — 8 numbers per box:
 * `x0,y0,..,x3,y3`.
 * @category Typescript API
 * @param flat The flat number array from a native detector decode.
 * @returns The parsed quads.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if `flat` is not a
 * multiple of 8 values.
 */
export function quadsFromFlat(flat: ArrayLike<number>): Quad[] {
  'worklet';
  if (flat.length % 8 !== 0) {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
      `quadsFromFlat: expected a multiple of 8 values, got ${flat.length}.`
    );
  }
  const quads: Quad[] = [];
  for (let i = 0; i < flat.length; i += 8) {
    quads.push([
      { x: flat[i]!, y: flat[i + 1]! },
      { x: flat[i + 2]!, y: flat[i + 3]! },
      { x: flat[i + 4]!, y: flat[i + 5]! },
      { x: flat[i + 6]!, y: flat[i + 7]! },
    ]);
  }
  return quads;
}

// A gutter must be at least this fraction of the content width to split columns;
// two boxes share a line when their vertical extents overlap by at least this
// fraction of the shorter box's height.
const COLUMN_GAP_FRACTION = 0.06;
const LINE_OVERLAP_FRACTION = 0.3;

/**
 * Reorders `{quad}` items the way a human reads the page: leftmost column first
 * (top to bottom), then the next column. Detectors emit boxes in arbitrary
 * order, so results are sorted through this before being returned.
 * @category Typescript API
 * @typeParam T The item type, anything carrying a `quad`.
 * @param items The items to sort.
 * @returns The same items in reading order.
 */
export function orderByReadingOrder<T extends { quad: Quad }>(items: T[]): T[] {
  'worklet';
  const count = items.length;
  if (count <= 1) {
    return items;
  }

  const boxes = items.map((it) => boundsOfPoints(it.quad, 'xyxy'));

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
