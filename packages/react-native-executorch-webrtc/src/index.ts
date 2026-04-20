/**
 * ExecuTorch WebRTC Background Blur
 *
 * This package provides background blur/removal for WebRTC video calls
 * using ExecuTorch segmentation models. API is compatible with
 * `@fishjam-cloud/react-native-webrtc-background-blur`.
 * @packageDocumentation
 */

export { useBackgroundBlur } from './useBackgroundBlur';
export type {
  UseBackgroundBlurOptions,
  TrackMiddleware,
} from './useBackgroundBlur';

export {
  initializeBackgroundBlur,
  deinitializeBackgroundBlur,
  isBackgroundBlurInitialized,
} from './BackgroundBlur';

export type { Spec as BackgroundBlurSpec } from './NativeBackgroundBlur';
export { default as NativeBackgroundBlur } from './NativeBackgroundBlur';
