import { scalePoint, type Point } from './points';

/**
 * An oriented quadrilateral in pixel space: `points` are the four corners ordered
 * top-left, top-right, bottom-right, bottom-left, `score` is the region confidence
 * in `[0, 1]`, and `angle` is the rotation in degrees.
 * @category Types
 */
export type Quad = {
  readonly points: readonly Point[];
  readonly score: number;
  readonly angle: number;
};

/**
 * The axis-aligned bounds of a set of points.
 * @category Types
 */
export type Bounds = { xmin: number; ymin: number; xmax: number; ymax: number };

const distance = (a: Point, b: Point): number => {
  'worklet';
  return Math.hypot(b.x - a.x, b.y - a.y);
};

const lerp = (a: Point, b: Point, t: number): Point => {
  'worklet';
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
};

/**
 * Computes the axis-aligned bounds enclosing a set of points. Returns a zero box
 * for empty input.
 * @category Typescript API
 * @param points The points to enclose.
 * @returns The enclosing `{ xmin, ymin, xmax, ymax }` bounds.
 */
export function boundsOfPoints(points: readonly Point[]): Bounds {
  'worklet';
  if (points.length === 0) {
    return { xmin: 0, ymin: 0, xmax: 0, ymax: 0 };
  }
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
  return { xmin, ymin, xmax, ymax };
}

/**
 * Orders four corner points as top-left, top-right, bottom-right, bottom-left
 * using their coordinate-sum and coordinate-difference extremes. Inputs that do
 * not have exactly four points are returned unchanged.
 * @category Typescript API
 * @param points The four unordered corners.
 * @returns The corners ordered TL, TR, BR, BL.
 */
export function orderQuad(points: readonly Point[]): Point[] {
  'worklet';
  if (points.length !== 4) {
    return [...points];
  }
  let topLeft = 0;
  let topRight = 0;
  let bottomRight = 0;
  let bottomLeft = 0;
  let minSum = points[0]!.x + points[0]!.y;
  let maxSum = minSum;
  let minDiff = points[0]!.y - points[0]!.x;
  let maxDiff = minDiff;
  for (let i = 1; i < 4; i++) {
    const sum = points[i]!.x + points[i]!.y;
    const diff = points[i]!.y - points[i]!.x;
    if (sum < minSum) {
      minSum = sum;
      topLeft = i;
    }
    if (sum > maxSum) {
      maxSum = sum;
      bottomRight = i;
    }
    if (diff < minDiff) {
      minDiff = diff;
      topRight = i;
    }
    if (diff > maxDiff) {
      maxDiff = diff;
      bottomLeft = i;
    }
  }
  return [points[topLeft]!, points[topRight]!, points[bottomRight]!, points[bottomLeft]!];
}

/**
 * Computes the width and height (in pixels) of an ordered TL,TR,BR,BL quad, taking
 * the longer of each pair of opposite sides.
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
): Point[] {
  'worklet';
  return quad.points.map((p) => {
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
export function splitTallQuad(ordered: readonly Point[], parts: number): Point[][] {
  'worklet';
  if (parts <= 1) {
    return [ordered as Point[]];
  }
  const [tl, tr, br, bl] = ordered as [Point, Point, Point, Point];
  const out: Point[][] = [];
  for (let i = 0; i < parts; i++) {
    const t0 = i / parts;
    const t1 = (i + 1) / parts;
    out.push([lerp(tl, bl, t0), lerp(tr, br, t0), lerp(tr, br, t1), lerp(tl, bl, t1)]);
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
export function boundingQuadOf(quads: readonly (readonly Point[])[]): Point[] {
  'worklet';
  const all: Point[] = [];
  for (const q of quads) {
    for (const p of q) {
      all.push(p);
    }
  }
  const { xmin, ymin, xmax, ymax } = boundsOfPoints(all);
  return [
    { x: xmin, y: ymin },
    { x: xmax, y: ymin },
    { x: xmax, y: ymax },
    { x: xmin, y: ymax },
  ];
}

/**
 * Flattens an ordered TL,TR,BR,BL quad into the 8-number `[x0,y0,..,x3,y3]` array.
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
 * Builds oriented quads from a detector's flat output array — 10 numbers per box:
 * `x0,y0,..,x3,y3,score,angle`.
 * @category Typescript API
 * @param flat The flat number array from a native detector decode.
 * @returns The parsed quads.
 */
export function quadsFromFlat(flat: number[]): Quad[] {
  'worklet';
  const quads: Quad[] = [];
  for (let i = 0; i < flat.length; i += 10) {
    quads.push({
      points: [
        { x: flat[i]!, y: flat[i + 1]! },
        { x: flat[i + 2]!, y: flat[i + 3]! },
        { x: flat[i + 4]!, y: flat[i + 5]! },
        { x: flat[i + 6]!, y: flat[i + 7]! },
      ],
      score: flat[i + 8]!,
      angle: flat[i + 9]!,
    });
  }
  return quads;
}
