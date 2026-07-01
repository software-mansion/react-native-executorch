import { rnexecutorchJsi } from '../../../native/bridge';
import type { Tensor } from '../../../core/tensor';
import type { ResizeMode } from './image';
import { scalePoint, resizeFactors, type Point } from './points';

/**
 * Mapping of bounding box formats to their coordinate representations.
 * @category Types
 */
export type BoxMap = {
  xyxy: { xmin: number; ymin: number; xmax: number; ymax: number };
  xywh: { xmin: number; ymin: number; w: number; h: number };
  cxcywh: { cx: number; cy: number; w: number; h: number };
};

/**
 * The formats of bounding boxes.
 * @category Types
 */
export type BoxFormat = keyof BoxMap;

/**
 * Representation of a bounding box under a specific format.
 * @category Types
 */
export type BoundingBox<F extends BoxFormat> = F extends any
  ? { readonly format: F } & Readonly<BoxMap[F]>
  : never;

/**
 * Decodes bounding box coordinates from a 4-tuple into a structured BoundingBox
 * object.
 * @category Utils
 * @typeParam F Bounding box coordinate format.
 * @param tuple A 4-tuple array containing coordinates.
 * @param format The coordinate format to decode into.
 * @returns The decoded BoundingBox object.
 */
export function decodeBox<F extends BoxFormat>(
  tuple: [number, number, number, number],
  format: F
): BoundingBox<F> {
  'worklet';
  const [a, b, c, d] = tuple;
  switch (format) {
    case 'xyxy':
      return { format: 'xyxy', xmin: a, ymin: b, xmax: c, ymax: d } as BoundingBox<F>;
    case 'xywh':
      return { format: 'xywh', xmin: a, ymin: b, w: c, h: d } as BoundingBox<F>;
    case 'cxcywh':
      return { format: 'cxcywh', cx: a, cy: b, w: c, h: d } as BoundingBox<F>;
  }
}

/**
 * Scales bounding box coordinates based on scaling options and resize modes.
 * @category Utils
 * @typeParam F Bounding box coordinate format.
 * @param box The original BoundingBox.
 * @param opts Options defining dimensions and resize modes.
 * @param opts.from The source bounds (e.g. model input dimensions).
 * @param opts.to The destination bounds (e.g. original image dimensions).
 * @param opts.resizeMode The mode used to resize the image ('letterbox' or
 * 'stretch').
 * @returns The scaled BoundingBox object.
 */
export function scaleBox<F extends BoxFormat>(
  box: BoundingBox<F>,
  opts: {
    readonly from: { readonly width: number; readonly height: number };
    readonly to: { readonly width: number; readonly height: number };
    readonly resizeMode: Exclude<ResizeMode, 'crop'>;
  }
): BoundingBox<F> {
  'worklet';
  const { scaleX, scaleY } = resizeFactors(opts.from, opts.to, opts.resizeMode);

  switch (box.format) {
    case 'xyxy': {
      const pMin = scalePoint({ x: box.xmin, y: box.ymin }, opts);
      const pMax = scalePoint({ x: box.xmax, y: box.ymax }, opts);
      return {
        format: 'xyxy',
        xmin: pMin.x,
        ymin: pMin.y,
        xmax: pMax.x,
        ymax: pMax.y,
      } as BoundingBox<F>;
    }
    case 'xywh': {
      const pMin = scalePoint({ x: box.xmin, y: box.ymin }, opts);
      return {
        format: 'xywh',
        xmin: pMin.x,
        ymin: pMin.y,
        w: box.w / scaleX,
        h: box.h / scaleY,
      } as BoundingBox<F>;
    }
    case 'cxcywh': {
      const pCenter = scalePoint({ x: box.cx, y: box.cy }, opts);
      return {
        format: 'cxcywh',
        cx: pCenter.x,
        cy: pCenter.y,
        w: box.w / scaleX,
        h: box.h / scaleY,
      } as BoundingBox<F>;
    }
  }
}

/**
 * Computes the axis-aligned bounding box (`xyxy`) enclosing a set of points,
 * e.g. the corners of an oriented OCR {@link Quad}.
 * @category Utils
 * @param points The points to bound (need not be ordered).
 * @returns The enclosing bounding box in `xyxy` format.
 */
export function boundingBoxOf(points: readonly Point[]): BoundingBox<'xyxy'> {
  'worklet';
  if (points.length === 0) {
    return { format: 'xyxy', xmin: 0, ymin: 0, xmax: 0, ymax: 0 };
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
  return { format: 'xyxy', xmin, ymin, xmax, ymax };
}

/**
 * Options for Non-Maximum Suppression (NMS).
 * @category Types
 */
export type NmsOptions = {
  readonly boxFormat: BoxFormat;
  readonly iouThreshold: number;
  readonly confidenceThreshold: number;
  readonly nmsType: 'standard' | 'weighted';
};

/**
 * Executes Non-Maximum Suppression (NMS) on bounding boxes and confidence
 * scores.
 * @category Utils
 * @param boxes Bounding boxes coordinate tensor.
 * @param scores Bounding boxes confidence scores tensor.
 * @param opts Options configure NMS thresholds and execution mode.
 * @returns The resulting indices of the non-suppressed boxes:
 * - For `standard` NMS: A 1D array of indices (`number[]`) representing the
 *   selected boxes.
 * - For `weighted` NMS: A 2D array of indices (`number[][]`) representing
 *   groups of overlapping boxes, where the first element of each group is the
 *   top candidate and the group indices are used to calculate the weighted
 *   average of coordinates.
 */
export function nms(
  boxes: Tensor,
  scores: Tensor,
  opts: NmsOptions & { readonly nmsType: 'standard' }
): number[];
export function nms(
  boxes: Tensor,
  scores: Tensor,
  opts: NmsOptions & { readonly nmsType: 'weighted' }
): number[][];
export function nms(boxes: Tensor, scores: Tensor, opts: NmsOptions): number[] | number[][] {
  'worklet';
  return rnexecutorchJsi.cv.nms(boxes, scores, opts);
}

/**
 * Masks the source tensor by keeping only the elements inside the specified
 * bounding box, writing the result to a pre-allocated destination tensor.
 *
 * Note: This operation does not change the tensor dimensions (it does not crop
 * the shape). Instead, it copies the elements within the box coordinates from
 * `src` to `dst`, and sets all elements outside the box to `0`.
 * @category Typescript API
 * @param src The source tensor of shape [H, W, C].
 * @param dst The pre-allocated destination tensor of shape [H, W, C] and the
 * same data type as `src`.
 * @param box The bounding box defining the region of interest to copy.
 * @returns The destination tensor containing the masked output.
 */
export function restrictToBox(src: Tensor, dst: Tensor, box: BoundingBox<BoxFormat>): Tensor {
  'worklet';
  let [a, b, c, d] = [0, 0, 0, 0];
  switch (box.format) {
    case 'xyxy':
      [a, b, c, d] = [box.xmin, box.ymin, box.xmax, box.ymax];
      break;
    case 'xywh':
      [a, b, c, d] = [box.xmin, box.ymin, box.w, box.h];
      break;
    case 'cxcywh':
      [a, b, c, d] = [box.cx, box.cy, box.w, box.h];
      break;
  }
  return rnexecutorchJsi.cv.restrictToBox(src, dst, [a, b, c, d], box.format);
}
