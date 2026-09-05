import { Bbox } from '../types/objectDetection';

/**
 * Calculates the area of a bounding box.
 * @param bbox - Bounding box to calculate area for.
 * @returns Area of the bounding box.
 */
export function bboxArea(bbox: Bbox): number {
  return Math.max(bbox.x2 - bbox.x1, 0) * Math.max(bbox.y2 - bbox.y1, 0);
}
