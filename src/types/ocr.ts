import { Bbox } from './object_detection';

export interface OCRDetection {
  bbox: Bbox;
  text: string;
  score: number;
}
