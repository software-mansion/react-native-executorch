import { symbols } from '../constants/ocr/symbols';

export interface OCRDetection {
  bbox: Point[];
  text: string;
  score: number;
}

export interface Point {
  x: number;
  y: number;
}

export type OCRLanguage = keyof typeof symbols;
