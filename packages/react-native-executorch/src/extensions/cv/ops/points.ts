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
export function scalePoint(
  point: Point,
  opts: {
    readonly from: { readonly width: number; readonly height: number };
    readonly to: { readonly width: number; readonly height: number };
    readonly resizeMode: Exclude<ResizeMode, 'crop'>;
  }
): Point {
  'worklet';
  const { from, to, resizeMode } = opts;
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
