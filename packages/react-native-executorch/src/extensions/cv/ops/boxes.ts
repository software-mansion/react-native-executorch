/**
 * Bounding box coordinate decoding, coordinate transforms, and Non-Maximum
 * Suppression (NMS).
 * @module CV/Ops/Boxes
 */

import { rnexecutorchJsi } from '../../../native/bridge';
import type { Tensor } from '../../../core/tensor';
import type { ResizeMode } from './image';
import { scalePoint } from './points';

/**
 * Mapping of bounding box formats to their coordinate representations.
 * @category CV / Types
 */
export type BoxMap = Readonly<{
  xyxy: Readonly<{ xmin: number; ymin: number; xmax: number; ymax: number }>;
  xywh: Readonly<{ xmin: number; ymin: number; w: number; h: number }>;
  cxcywh: Readonly<{ cx: number; cy: number; w: number; h: number }>;
}>;

/**
 * The formats of bounding boxes.
 * @category CV / Types
 */
export type BoxFormat = keyof BoxMap;

/**
 * Representation of a bounding box under a specific format.
 * @category CV / Types
 */
export type BoundingBox<F extends BoxFormat> = F extends any
  ? { readonly format: F } & BoxMap[F]
  : never;

/**
 * Configuration options for scaling bounding box coordinates.
 * @category CV / Types
 */
export type ScaleBoxOptions = {
  /** The source bounds (e.g. model input dimensions). */
  readonly from: { readonly width: number; readonly height: number };
  /** The destination bounds (e.g. original image dimensions). */
  readonly to: { readonly width: number; readonly height: number };
  /** The mode used to resize the image (excluding `'crop'`). */
  readonly resizeMode: Exclude<ResizeMode, 'crop'>;
};

/**
 * Decodes bounding box coordinates from a 4-tuple into a structured BoundingBox
 * object.
 * @category CV / Functions
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
 * @category CV / Functions
 * @typeParam F Bounding box coordinate format.
 * @param box The original BoundingBox.
 * @param options Options defining dimensions and resize modes.
 * See {@link ScaleBoxOptions}.
 * @returns The scaled BoundingBox object.
 */
export function scaleBox<F extends BoxFormat>(
  box: BoundingBox<F>,
  options: ScaleBoxOptions
): BoundingBox<F> {
  'worklet';
  const { from, to, resizeMode } = options;

  let scaleX: number;
  let scaleY: number;
  switch (resizeMode) {
    case 'letterbox': {
      const scale = Math.min(from.width / to.width, from.height / to.height);
      scaleX = scale;
      scaleY = scale;
      break;
    }
    case 'stretch':
      scaleX = from.width / to.width;
      scaleY = from.height / to.height;
      break;
  }

  switch (box.format) {
    case 'xyxy': {
      const pMin = scalePoint({ x: box.xmin, y: box.ymin }, options);
      const pMax = scalePoint({ x: box.xmax, y: box.ymax }, options);
      return {
        format: 'xyxy',
        xmin: pMin.x,
        ymin: pMin.y,
        xmax: pMax.x,
        ymax: pMax.y,
      } as BoundingBox<F>;
    }
    case 'xywh': {
      const pMin = scalePoint({ x: box.xmin, y: box.ymin }, options);
      return {
        format: 'xywh',
        xmin: pMin.x,
        ymin: pMin.y,
        w: box.w / scaleX,
        h: box.h / scaleY,
      } as BoundingBox<F>;
    }
    case 'cxcywh': {
      const pCenter = scalePoint({ x: box.cx, y: box.cy }, options);
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
 * Options for Non-Maximum Suppression (NMS).
 * @category CV / Types
 */
export type NmsOptions = {
  /** How bounding box coordinates are interpreted {@link BoxFormat}. */
  readonly boxFormat: BoxFormat;
  /** Intersection over Union (IoU) threshold for suppressing overlapping boxes. */
  readonly iouThreshold: number;
  /** Minimum confidence score threshold for filtering candidate boxes. */
  readonly confidenceThreshold: number;
  /**
   * NMS algorithm variant (`standard` for hard suppression, `weighted` for soft
   * coordinate averaging).
   */
  readonly nmsType: 'standard' | 'weighted';
};

/**
 * Executes Non-Maximum Suppression (NMS) on bounding boxes and confidence
 * scores.
 * @category CV / Functions
 * @param boxes Bounding boxes coordinate tensor. Expected shape `[N, 4]` and
 * data type `float32`.
 * @param scores Bounding boxes confidence scores tensor. Expected shape `[N]`
 * (1D) and data type `float32`.
 * @param options Options configuring NMS thresholds and execution mode.
 * See {@link NmsOptions}.
 * @returns The resulting indices of the non-suppressed boxes:
 * - For `standard` NMS: A 1D array of indices (`number[]`) representing the
 *   selected boxes.
 * - For `weighted` NMS: A 2D array of indices (`number[][]`) representing
 *   groups of overlapping boxes, where the first element of each group is the
 *   top candidate and the group indices are used to calculate the weighted
 *   average of coordinates.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if tensor shapes or
 * formats are invalid, `RESOURCE_BUSY` if a tensor is in use, or
 * `RESOURCE_DISPOSED` if either tensor was disposed.
 */
export function nms(
  boxes: Tensor,
  scores: Tensor,
  options: NmsOptions & { readonly nmsType: 'standard' }
): number[];
export function nms(
  boxes: Tensor,
  scores: Tensor,
  options: NmsOptions & { readonly nmsType: 'weighted' }
): number[][];
export function nms(boxes: Tensor, scores: Tensor, options: NmsOptions): number[] | number[][] {
  'worklet';
  return rnexecutorchJsi.cv.nms(boxes, scores, options);
}

/**
 * Masks the source image tensor by keeping only the elements inside the specified
 * bounding box, writing the result to a pre-allocated destination image tensor.
 *
 * Note: This operation does not change the image tensor dimensions (it does not crop
 * the shape). Instead, it copies the elements within the box coordinates from
 * `src` to `dst`, and sets all elements outside the box to `0`.
 * @category CV / Functions
 * @param src The source image tensor in HWC layout. Expected shape `[H, W, C]`
 * (channels-last). Supports any numeric data type.
 * @param dst The pre-allocated destination image tensor to write masked values to.
 * Expected shape `[H, W, C]` in HWC layout and the same data type as `src`.
 * @param box The bounding box defining the region of interest to copy.
 * @returns The destination image tensor containing the masked output of shape
 * `[H, W, C]` and matching data type.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if tensor shapes,
 * layouts, or data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
 * `RESOURCE_DISPOSED` if either tensor was disposed.
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
