/**
 * Supported pixel format layouts for image buffers.
 * @category Types
 */
export type ImageFormat = 'rgb' | 'rgba' | 'bgr' | 'bgra';

/**
 * Represents a raw CPU image buffer in HWC (Height, Width, Channel) layout.
 * @category Types
 */
export type ImageBuffer = {
  readonly data: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly format: ImageFormat;
  readonly layout: 'hwc';
};
