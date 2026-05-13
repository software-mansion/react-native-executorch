import { LabelEnum } from '../types/common';
import { Bbox } from '../types/objectDetection';
import { SegmentedInstance } from '../types/instanceSegmentation';
import { bboxArea } from './commonVision';

/**
 * Selects the best matching instance for a given point prompt.
 *
 * Finds all instances whose mask covers the point (x, y), then returns the one
 * with the smallest bounding box area (ties broken by highest confidence).
 * @param instances - Array of segmented instances returned by `forward()`.
 * @param x - X coordinate in original image space.
 * @param y - Y coordinate in original image space.
 * @returns The best matching instance, or `null` if no mask covers the point.
 */
export function selectByPoint<L extends LabelEnum>(
  instances: SegmentedInstance<L>[],
  x: number,
  y: number
): SegmentedInstance<L> | null {
  const px = Math.round(x);
  const py = Math.round(y);

  const matches = instances.filter((inst) => {
    const mx = px - Math.round(inst.bbox.x1);
    const my = py - Math.round(inst.bbox.y1);
    if (mx < 0 || my < 0 || mx >= inst.maskWidth || my >= inst.maskHeight) {
      return false;
    }
    return inst.mask[my * inst.maskWidth + mx] === 1;
  });

  if (matches.length === 0) return null;

  return matches.reduce((best, inst) => {
    const boxArea = bboxArea(inst.bbox);
    const bestBoxArea = bboxArea(best.bbox);
    if (boxArea !== bestBoxArea) return boxArea < bestBoxArea ? inst : best;

    return inst.score > best.score ? inst : best;
  });
}

/**
 * Selects the best matching instance for a given box prompt.
 *
 * Finds all instances that overlap with the prompt box, then returns the one
 * with the highest IoU with that box (ties broken by highest confidence).
 * @param instances - Array of segmented instances returned by `forward()`.
 * @param box - The prompt bounding box in image coordinates.
 * @returns The best matching instance, or `null` if no instance overlaps.
 */
export function selectByBox<L extends LabelEnum>(
  instances: SegmentedInstance<L>[],
  box: Bbox
): SegmentedInstance<L> | null {
  const { x1: px1, y1: py1, x2: px2, y2: py2 } = box;
  const promptArea = bboxArea(box);

  type Match = {
    iou: number;
    score: number;
    inst: SegmentedInstance<L>;
  };
  let best: Match | null = null;

  for (const inst of instances) {
    const { x1, y1, x2, y2 } = inst.bbox;
    const interX1 = Math.max(px1, x1);
    const interY1 = Math.max(py1, y1);
    const interX2 = Math.min(px2, x2);
    const interY2 = Math.min(py2, y2);
    const interArea =
      Math.max(interX2 - interX1, 0) * Math.max(interY2 - interY1, 0);
    if (interArea <= 0) continue;

    const detArea = bboxArea(inst.bbox);
    const iou = interArea / (promptArea + detArea - interArea + 1e-7);

    if (
      best === null ||
      iou > best.iou ||
      (iou === best.iou && inst.score > best.score)
    ) {
      best = { iou, score: inst.score, inst };
    }
  }

  return best?.inst ?? null;
}

/**
 * Selects the best matching instance(s) for a text prompt.
 *
 * Returns the instance(s) whose image embedding has the highest cosine similarity
 * with the text embedding. The caller is responsible for producing the
 * embeddings (e.g. with CLIP) and passing them in the same order as
 * `instances`.
 * @param instances - Array of segmented instances returned by `forward()`.
 * @param instanceEmbeddings - Image embedding for each instance, in the same order as `instances`.
 * @param textEmbedding - Embedding of the text prompt.
 * @param topk - Number of top matches to return (defaults to 1).
 * @returns The best matching instance (or null) if topk is 1, otherwise an array of the topk matching instances.
 */
export function selectByText<L extends LabelEnum>(
  instances: SegmentedInstance<L>[],
  instanceEmbeddings: Float32Array[],
  textEmbedding: Float32Array,
  topk?: 1
): SegmentedInstance<L> | null;
export function selectByText<L extends LabelEnum>(
  instances: SegmentedInstance<L>[],
  instanceEmbeddings: Float32Array[],
  textEmbedding: Float32Array,
  topk: number
): SegmentedInstance<L>[];
export function selectByText<L extends LabelEnum>(
  instances: SegmentedInstance<L>[],
  instanceEmbeddings: Float32Array[],
  textEmbedding: Float32Array,
  topk = 1
): SegmentedInstance<L> | null | SegmentedInstance<L>[] {
  if (instances.length === 0) return topk === 1 ? null : [];
  if (instances.length !== instanceEmbeddings.length) {
    throw new Error(
      `selectByText: instances (${instances.length}) ` +
        `and instanceEmbeddings (${instanceEmbeddings.length}) ` +
        `must have the same length`
    );
  }

  const scores = instanceEmbeddings.map((emb) => {
    let dot = 0;
    for (let j = 0; j < emb.length; j++) {
      dot += emb[j]! * textEmbedding[j]!;
    }
    return dot;
  });

  if (topk === 1) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < scores.length; i++) {
      if (scores[i]! > bestScore) {
        bestScore = scores[i]!;
        bestIdx = i;
      }
    }
    return instances[bestIdx]!;
  }

  return instances
    .map((instance, index) => ({ instance, score: scores[index]! }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topk)
    .map((item) => item.instance);
}
