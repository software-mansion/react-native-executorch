export interface OCRDetection {
  bbox: OCRBbox[];
  text: string;
  score: number;
}

export interface OCRBbox {
  x: number;
  y: number;
}

export type OCRLanguage = 'en';
