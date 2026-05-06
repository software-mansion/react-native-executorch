import { LabelEnum } from '../types/common';
import { Bbox } from '../types/objectDetection';
import { SegmentedInstance } from '../types/instanceSegmentation';

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
  const promptArea = Math.max(px2 - px1, 0) * Math.max(py2 - py1, 0);

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

function bboxArea(bbox: Bbox): number {
  return Math.max(bbox.x2 - bbox.x1, 0) * Math.max(bbox.y2 - bbox.y1, 0);
}

/**
 * Selects the best matching instance for a text prompt.
 *
 * Returns the instance whose image embedding has the highest cosine similarity
 * with the text embedding. The caller is responsible for producing the
 * embeddings (e.g. with CLIP) and passing them in the same order as
 * `instances`; embeddings do not need to be pre-normalized.
 * @param instances - Array of segmented instances returned by `forward()`.
 * @param instanceEmbeddings - Image embedding for each instance, in the same order as `instances`.
 * @param textEmbedding - Embedding of the text prompt.
 * @returns The best matching instance, or `null` if `instances` is empty.
 */
export function selectByText<L extends LabelEnum>(
  instances: SegmentedInstance<L>[],
  instanceEmbeddings: Float32Array[],
  textEmbedding: Float32Array
): SegmentedInstance<L> | null {
  if (instances.length === 0) return null;
  if (instances.length !== instanceEmbeddings.length) {
    throw new Error(
      `selectByText: instances (${instances.length}) and instanceEmbeddings (${instanceEmbeddings.length}) must have the same length`
    );
  }

  let textNormSq = 0;
  for (let i = 0; i < textEmbedding.length; i++) {
    const v = textEmbedding[i]!;
    textNormSq += v * v;
  }
  const textNorm = Math.sqrt(textNormSq);

  let bestIdx = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < instances.length; i++) {
    const emb = instanceEmbeddings[i]!;
    const n = Math.min(emb.length, textEmbedding.length);
    let dot = 0;
    let embNormSq = 0;
    for (let j = 0; j < n; j++) {
      const a = emb[j]!;
      dot += a * textEmbedding[j]!;
      embNormSq += a * a;
    }
    const score = dot / (Math.sqrt(embNormSq) * textNorm + 1e-7);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return instances[bestIdx]!;
}
