export type ImageFormat = 'rgb' | 'rgba' | 'bgr' | 'bgra';

export type ImageBuffer = {
  readonly data: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly format: ImageFormat;
  readonly layout: 'hwc';
};
