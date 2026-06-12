import { Detection } from 'react-native-executorch';
import { TrailPoint } from './components/ImageWithBboxes';

// The class whose movement gets traced across frames ("sport tracker" line).
// The ball is 'SPORTS' in the 91-class CocoLabel (SSDLite, RF-DETR) and
// 'SPORTS_BALL' in the 80-class CocoLabelYolo.
const TRACKED_LABELS = new Set(['SPORTS', 'SPORTS_BALL']);

// RF-DETR scores every query; its native postprocess just drops everything
// below the threshold. Running detection at a low threshold recovers weak
// ball sightings (in the net, motion-blurred) that the default would discard.
// Strong detections are trusted outright; weak ones only when temporally
// consistent with the previous sighting.
export const LOW_DETECTION_THRESHOLD = 0.15;
const BALL_CONFIDENT_SCORE = 0.5;
// Boxes drawn on screen keep the usual confidence bar.
export const DISPLAY_SCORE_THRESHOLD = 0.55;

// One ball position with the frame it was observed in, so timing can account
// for frames where the ball was not detected.
export interface BallSample {
  x: number;
  y: number;
  /** Ball bbox height in px, used as the apparent ball diameter. */
  size: number;
  score: number;
  frameIndex: number;
}

export function trackedBall(
  detections: Detection[],
  prev: BallSample | null
): (TrailPoint & { size: number; score: number }) | null {
  let best: (TrailPoint & { size: number; score: number }) | null = null;
  for (const det of detections) {
    if (!TRACKED_LABELS.has(String(det.label))) continue;
    const candidate = {
      x: (det.bbox.x1 + det.bbox.x2) / 2,
      y: (det.bbox.y1 + det.bbox.y2) / 2,
      // Height over width: motion blur smears the bbox mostly along the
      // (roughly horizontal) flight direction, so height is the stabler size.
      size: det.bbox.y2 - det.bbox.y1,
      score: det.score,
    };
    const confident = det.score >= BALL_CONFIDENT_SCORE;
    const consistent =
      prev !== null &&
      Math.hypot(candidate.x - prev.x, candidate.y - prev.y) <= prev.size * 8 &&
      candidate.size >= prev.size * 0.4 &&
      candidate.size <= prev.size * 1.8;
    if (!confident && !consistent) continue;
    if (!best || candidate.score > best.score) best = candidate;
  }
  return best;
}
