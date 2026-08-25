/**
 * Core image buffer types and pixel formats for Computer Vision.
 * @module CV/Image
 */

/**
 * Supported pixel format layouts for image buffers.
 * @category CV / Types
 */
export type ImageFormat = 'rgb' | 'rgba' | 'bgr' | 'bgra' | 'gray';

/**
 * Represents a raw CPU image buffer in HWC (Height, Width, Channel) layout.
 * @category CV / Types
 */
export type ImageBuffer = {
  readonly data: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly format: ImageFormat;
  readonly layout: 'hwc';
};
