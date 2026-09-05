/**
 * Quadrilateral geometry, bounding box extraction, and image rectification
 * utilities.
 */

import { rnexecutorchJsi } from '../../../native/bridge';
import type { Tensor } from '../../../core/tensor';
import { RnExecuTorchError } from '../../../core/error';
import { distance, scalePoint, type Point } from './point';
import type { BoundingBox, BoxFormat } from './box';
import type { ResizeMode } from './image';

/**
 * A quadrilateral in pixel space: exactly four corners, in no guaranteed order.
 * Helpers that need them as top-left, top-right, bottom-right, bottom-left say
 * so on their `ordered` parameter; pass the quad through {@link orderQuad}
 * first. Never assume a `Quad` you were handed is already ordered.
 * @category CV / Types
 */
export type Quad = readonly [Point, Point, Point, Point];

/**
 * Computes the axis-aligned bounding box enclosing a set of points, in the
 * requested box format. Returns a zero box for empty input.
 * @category CV / Functions
 * @typeParam F Bounding box coordinate format.
 * @param points The points to enclose.
 * @param format The coordinate format of the returned box.
 * @returns The enclosing {@link BoundingBox} in `format`.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if the bounding box
 * format is unsupported.
 */
export function boundingBoxOfPoints<F extends BoxFormat>(
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
        `boundingBoxOfPoints: unsupported box format '${format}'.`
      );
  }
}

/**
 * Reorders a quad's corners into the top-left, top-right, bottom-right,
 * bottom-left order the rest of this module assumes, using their
 * coordinate-sum and coordinate-difference extremes.
 * @category CV / Functions
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
 * @category CV / Functions
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
 * Configuration options for scaling quad coordinates.
 * @category CV / Types
 */
export type ScaleQuadOptions = {
  /** The source bounds (e.g. model input dimensions). */
  readonly from: { readonly width: number; readonly height: number };
  /** The destination bounds (e.g. original image dimensions). */
  readonly to: { readonly width: number; readonly height: number };
  /** The mode used to resize the image (excluding `'crop'`). */
  readonly resizeMode?: Exclude<ResizeMode, 'crop'>;
};

/**
 * Rescales a quad from one frame to another, clamping the result to the target
 * bounds. The counterpart of {@link scaleBox} for quads.
 * @category CV / Functions
 * @param quad The quad, expressed in the `from` frame.
 * @param options Options detailing the scaling factors and resize mode.
 * See {@link ScaleQuadOptions}.
 * @returns The four corners in `to` pixels.
 */
export function scaleQuad(quad: Quad, options: ScaleQuadOptions): Quad {
  'worklet';
  const { from, to, resizeMode } = options;
  const map = (p: Point): Point => {
    const m = scalePoint(p, { from, to, resizeMode: resizeMode ?? 'letterbox' });
    return { x: Math.max(0, Math.min(m.x, to.width)), y: Math.max(0, Math.min(m.y, to.height)) };
  };
  return [map(quad[0]), map(quad[1]), map(quad[2]), map(quad[3])];
}

/**
 * Options for {@link rectifyQuad}.
 * @category CV / Types
 */
export type RectifyQuadOptions = {
  /** Width in px the rectified content occupies inside the destination canvas. */
  readonly contentWidth: number;
  /** Where the content sits in the canvas. Default `'left'`. */
  readonly align?: 'left' | 'center';
  /** Value the canvas is filled with outside the content. Default `0`. */
  readonly padValue?: number;
};

/**
 * Rectifies an oriented quad region of `src` into the flat pre-allocated canvas
 * `dst`: perspective crop, resize to the canvas height, and pad, in one native
 * pass. An axis-aligned bbox is a 4-corner quad, so pass its corners to
 * rectify a box.
 * @category CV / Functions
 * @param src The source image, `uint8` `[H, W, C]`.
 * @param dst The pre-allocated destination canvas, `uint8` `[H', W', C]`, with
 * the same channel count as `src`. Must not alias `src`.
 * @param quad The region corners (TL, TR, BR, BL) in `src` pixels.
 * @param options Content width, alignment, and padding. See {@link RectifyQuadOptions}.
 * @returns The destination tensor `dst`.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if tensor shapes,
 * data types, or quadrilateral coordinates are invalid, `RESOURCE_BUSY` if a
 * tensor is in use, or `RESOURCE_DISPOSED` if either tensor was disposed.
 */
export function rectifyQuad(
  src: Tensor,
  dst: Tensor,
  quad: Quad,
  options: RectifyQuadOptions
): Tensor {
  'worklet';
  // The native op takes the corners as a flat [x0,y0,..,x3,y3] array.
  const flat = quad.flatMap((p) => [p.x, p.y]);
  return rnexecutorchJsi.cv.rectifyQuad(src, dst, flat, {
    contentWidth: options.contentWidth,
    align: options.align ?? 'left',
    padValue: options.padValue ?? 0,
  });
}
