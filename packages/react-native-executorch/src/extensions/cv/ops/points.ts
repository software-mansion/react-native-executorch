import type { ResizeMode } from './image';

/**
 * Represents a 2D coordinate point with x and y values.
 * @category Types
 */
export type Point = {
  readonly x: number;
  readonly y: number;
};

/**
 * Clamps a scalar to the inclusive range `[lo, hi]`.
 * @category Utils
 * @param v The value to clamp.
 * @param lo The lower bound.
 * @param hi The upper bound.
 * @returns `v` constrained to `[lo, hi]`.
 */
export function clamp(v: number, lo: number, hi: number): number {
  'worklet';
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Helper function to scale a 2D point based on resize mode and resolution
 * changes.
 * @category Utils
 * @param point The original coordinate point to scale.
 * @param opts Options detailing the scaling factors and resize mode.
 * @param opts.from The source bounds (e.g. model input dimensions).
 * @param opts.to The destination bounds (e.g. original image dimensions).
 * @param opts.resizeMode The mode used to resize the image ('letterbox' or
 * 'stretch').
 * @returns The scaled coordinate point.
 */
/**
 * Per-axis scale and offset that map a `to`-space coordinate back into
 * `from`-space, for an aspect-preserving letterbox or an axis stretch. The
 * inverse map is `(coord − offset) / scale` per axis (offset is 0 for stretch).
 * Shared by {@link scalePoint} and `scaleBox` so the factors are derived once.
 * @category Utils
 * @param from The source bounds (e.g. model input dimensions).
 * @param to The destination bounds (e.g. original image dimensions).
 * @param resizeMode The resize mode the source was produced with.
 * @returns The per-axis `scaleX`/`scaleY` and `offsetX`/`offsetY`.
 */
export function resizeFactors(
  from: { readonly width: number; readonly height: number },
  to: { readonly width: number; readonly height: number },
  resizeMode: Exclude<ResizeMode, 'crop'>
): { scaleX: number; scaleY: number; offsetX: number; offsetY: number } {
  'worklet';
  if (resizeMode === 'letterbox') {
    const scale = Math.min(from.width / to.width, from.height / to.height);
    return {
      scaleX: scale,
      scaleY: scale,
      offsetX: (from.width - to.width * scale) / 2.0,
      offsetY: (from.height - to.height * scale) / 2.0,
    };
  }
  return { scaleX: from.width / to.width, scaleY: from.height / to.height, offsetX: 0, offsetY: 0 };
}

export function scalePoint(
  point: Point,
  opts: {
    readonly from: { readonly width: number; readonly height: number };
    readonly to: { readonly width: number; readonly height: number };
    readonly resizeMode: Exclude<ResizeMode, 'crop'>;
  }
): Point {
  'worklet';
  const { scaleX, scaleY, offsetX, offsetY } = resizeFactors(opts.from, opts.to, opts.resizeMode);
  return { x: (point.x - offsetX) / scaleX, y: (point.y - offsetY) / scaleY };
}
