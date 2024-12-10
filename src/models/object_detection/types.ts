export enum ObjectDetectionModel {
  SSDLITE_LARGE = 'SSDLITE_LARGE',
}

export enum ObjectDetectionOutputType {
  IMAGE = 1,
  DETECTIONS = 2,
  ALL = 3,
}

export interface Bbox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Detection {
  bbox: Bbox;
  label: string; // TODO
  score: number;
}

export interface ObjectDetectionResult {
  outputImageUri?: String[];
  detections: Detection[];
}
