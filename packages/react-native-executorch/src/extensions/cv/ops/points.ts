/**
 * 2D point representation and spatial scaling utilities.
 * @module CV/Ops/Points
 */

import type { ResizeMode } from './image';

/**
 * Represents a 2D coordinate point with x and y values.
 * @category CV / Types
 */
export type Point = {
  readonly x: number;
  readonly y: number;
};

/**
 * Euclidean distance between two points.
 * @category CV / Functions
 * @param a The first point.
 * @param b The second point.
 * @returns The distance between `a` and `b`.
 */
export function distance(a: Point, b: Point): number {
  'worklet';
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Linearly interpolates between two points: `t = 0` returns `a`, `t = 1`
 * returns `b`, values in between interpolate along the segment.
 * @category CV / Functions
 * @param a The start point.
 * @param b The end point.
 * @param t The interpolation factor.
 * @returns The interpolated point.
 */
export function interpolatePoint(a: Point, b: Point, t: number): Point {
  'worklet';
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/**
 * Configuration options for scaling 2D point coordinates.
 * @category CV / Types
 */
export type ScalePointOptions = {
  /** The source bounds (e.g. model input dimensions). */
  readonly from: { readonly width: number; readonly height: number };
  /** The destination bounds (e.g. original image dimensions). */
  readonly to: { readonly width: number; readonly height: number };
  /** The mode used to resize the image (excluding `'crop'`). */
  readonly resizeMode: Exclude<ResizeMode, 'crop'>;
};

/**
 * Helper function to scale a 2D point based on resize mode and resolution
 * changes.
 * @category CV / Functions
 * @param point The original coordinate point to scale.
 * @param options Options detailing the scaling factors and resize mode.
 * See {@link ScalePointOptions}.
 * @returns The scaled coordinate point.
 */
export function scalePoint(point: Point, options: ScalePointOptions): Point {
  'worklet';
  const { from, to, resizeMode } = options;
  switch (resizeMode) {
    case 'letterbox': {
      const scale = Math.min(from.width / to.width, from.height / to.height);
      const offsetX = (from.width - to.width * scale) / 2.0;
      const offsetY = (from.height - to.height * scale) / 2.0;
      return { x: (point.x - offsetX) / scale, y: (point.y - offsetY) / scale };
    }
    case 'stretch': {
      const scaleX = from.width / to.width;
      const scaleY = from.height / to.height;
      return { x: point.x / scaleX, y: point.y / scaleY };
    }
  }
}
