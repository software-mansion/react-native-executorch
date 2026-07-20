import { scalePoint, type Point } from './points';
import type { BoundingBox, BoxFormat } from './boxes';

/**
 * An oriented quadrilateral in pixel space: the four corners ordered top-left,
 * top-right, bottom-right, bottom-left. Orientation lives in the corners
 * themselves.
 * @category Types
 */
export type Quad = readonly Point[];

const distance = (a: Point, b: Point): number => {
  'worklet';
  return Math.hypot(b.x - a.x, b.y - a.y);
};

const interpolatePoint = (a: Point, b: Point, t: number): Point => {
  'worklet';
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
};

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
      throw new Error(`boundsOfPoints: unsupported box format '${format}'.`);
  }
}

/**
 * Builds the axis-aligned bounding quad (ordered TL,TR,BR,BL) of an `xyxy` box —
 * the corner-ordering counterpart of an axis-aligned {@link BoundingBox}.
 * @category Typescript API
 * @param box The `xyxy` box.
 * @returns The four corners, ordered TL, TR, BR, BL.
 */
export function quadFromBounds(box: BoundingBox<'xyxy'>): Quad {
  'worklet';
  return [
    { x: box.xmin, y: box.ymin },
    { x: box.xmax, y: box.ymin },
    { x: box.xmax, y: box.ymax },
    { x: box.xmin, y: box.ymax },
  ];
}

/**
 * Orders four corner points as top-left, top-right, bottom-right, bottom-left
 * using their coordinate-sum and coordinate-difference extremes. Inputs that do
 * not have exactly four points are returned unchanged.
 * @category Typescript API
 * @param points The four unordered corners.
 * @returns The corners ordered TL, TR, BR, BL.
 */
export function orderQuad(points: readonly Point[]): Quad {
  'worklet';
  if (points.length !== 4) {
    return [...points];
  }
  // TL/BR are the corners with the min/max coordinate sum; TR/BL the min/max
  // difference (y − x). indexOfMin/Max break ties on the lowest index.
  const sum = points.map((p) => p.x + p.y);
  const diff = points.map((p) => p.y - p.x);
  const indexOfMin = (a: number[]) => a.indexOf(Math.min(...a));
  const indexOfMax = (a: number[]) => a.indexOf(Math.max(...a));
  const corners = [indexOfMin(sum), indexOfMin(diff), indexOfMax(sum), indexOfMax(diff)]; // TL, TR, BR, BL
  // Degenerate quads (duplicate or collinear corners) can map two roles to the
  // same point; the heuristic is meaningless there, so return the points
  // unchanged and let the resulting near-zero-size box be dropped downstream.
  if (new Set(corners).size !== 4) {
    return [...points];
  }
  return corners.map((i) => points[i]!);
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
  const [tl, tr, br, bl] = ordered as [Point, Point, Point, Point];
  const width = Math.max(distance(tl, tr), distance(bl, br));
  const height = Math.max(distance(tl, bl), distance(tr, br));
  return { width, height };
}

/**
 * Maps a quad expressed in a resized (letterboxed) frame back to the original
 * image frame, clamping the result to the image bounds.
 * @category Typescript API
 * @param quad The quad in the resized frame.
 * @param fromWidth The width of the resized frame the quad is expressed in.
 * @param fromHeight The height of the resized frame the quad is expressed in.
 * @param toWidth The original image width.
 * @param toHeight The original image height.
 * @returns The four corners in original image pixels.
 */
export function mapQuadToImage(
  quad: Quad,
  fromWidth: number,
  fromHeight: number,
  toWidth: number,
  toHeight: number
): Quad {
  'worklet';
  return quad.map((p) => {
    const m = scalePoint(p, {
      from: { width: fromWidth, height: fromHeight },
      to: { width: toWidth, height: toHeight },
      resizeMode: 'letterbox',
    });
    return { x: Math.max(0, Math.min(m.x, toWidth)), y: Math.max(0, Math.min(m.y, toHeight)) };
  });
}

/**
 * Splits an ordered TL,TR,BR,BL quad into `parts` equal vertical bands (each an
 * ordered quad), top to bottom. `parts <= 1` returns the quad unchanged.
 * @category Typescript API
 * @param ordered The quad corners ordered TL, TR, BR, BL.
 * @param parts The number of equal vertical bands to split into.
 * @returns The bands as ordered TL,TR,BR,BL quads, top to bottom.
 */
export function splitTallQuad(ordered: Quad, parts: number): Quad[] {
  'worklet';
  if (parts <= 1) {
    return [ordered];
  }
  const [tl, tr, br, bl] = ordered as [Point, Point, Point, Point];
  const out: Quad[] = [];
  for (let i = 0; i < parts; i++) {
    const t0 = i / parts;
    const t1 = (i + 1) / parts;
    out.push([
      interpolatePoint(tl, bl, t0),
      interpolatePoint(tr, br, t0),
      interpolatePoint(tr, br, t1),
      interpolatePoint(tl, bl, t1),
    ]);
  }
  return out;
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
  const [tl, tr, br, bl] = ordered as [Point, Point, Point, Point];
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
 * Computes the axis-aligned bounding quad (ordered TL,TR,BR,BL) enclosing a set of
 * quads. Returns a zero quad for empty input.
 * @category Typescript API
 * @param quads The quads to enclose.
 * @returns The four enclosing corners, ordered TL, TR, BR, BL.
 */
export function boundingQuadOf(quads: readonly Quad[]): Quad {
  'worklet';
  const all: Point[] = [];
  for (const q of quads) {
    for (const p of q) {
      all.push(p);
    }
  }
  const { xmin, ymin, xmax, ymax } = boundsOfPoints(all, 'xyxy');
  return [
    { x: xmin, y: ymin },
    { x: xmax, y: ymin },
    { x: xmax, y: ymax },
    { x: xmin, y: ymax },
  ];
}

/**
 * Builds oriented quads from a detector's flat output array — 8 numbers per box:
 * `x0,y0,..,x3,y3`.
 * @category Typescript API
 * @param flat The flat number array from a native detector decode.
 * @returns The parsed quads.
 */
export function quadsFromFlat(flat: readonly number[]): Quad[] {
  'worklet';
  if (flat.length % 8 !== 0) {
    throw new Error(`quadsFromFlat: expected a multiple of 8 values, got ${flat.length}.`);
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
