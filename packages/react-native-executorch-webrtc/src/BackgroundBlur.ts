import NativeBackgroundBlur from './NativeBackgroundBlur';

let initialized = false;

/**
 * Initialize the background blur processor with ExecuTorch segmentation model.
 * Must be called before using the blur middleware.
 * @param modelPath Path to the .pte segmentation model file
 * @example
 * ```ts
 * import { initializeBackgroundBlur } from '@executorch/react-native-executorch-webrtc';
 *
 * // Initialize with your model
 * initializeBackgroundBlur('/path/to/selfie_segmenter.pte');
 * ```
 */
export const initializeBackgroundBlur = (modelPath: string): void => {
  if (!NativeBackgroundBlur) {
    console.warn(
      '[ExecutorchWebRTC] Native module not available. Is the package properly linked?'
    );
    return;
  }

  if (initialized) {
    console.warn('[ExecutorchWebRTC] Background blur already initialized');
    return;
  }

  NativeBackgroundBlur.initialize(modelPath);
  initialized = true;
};

/**
 * Deinitialize and release background blur resources.
 * @example
 * ```ts
 * import { deinitializeBackgroundBlur } from '@executorch/react-native-executorch-webrtc';
 *
 * deinitializeBackgroundBlur();
 * ```
 */
export const deinitializeBackgroundBlur = (): void => {
  if (!NativeBackgroundBlur) {
    return;
  }

  if (!initialized) {
    return;
  }

  NativeBackgroundBlur.deinitialize();
  initialized = false;
};

/**
 * Check if background blur has been initialized
 * @returns Whether background blur is initialized
 */
export const isBackgroundBlurInitialized = (): boolean => {
  return initialized;
};
