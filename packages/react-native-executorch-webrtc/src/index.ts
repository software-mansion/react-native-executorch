/**
 * ExecuTorch WebRTC integration
 *
 * This package provides frame processing integration between
 * react-native-executorch and react-native-webrtc.
 *
 * @packageDocumentation
 */

import { NativeModules, Platform } from 'react-native';

// Auto-initialize the native module to register the processor
// This happens when the package is first imported
if (Platform.OS === 'android') {
  const { ExecutorchWebRTC } = NativeModules;
  if (ExecutorchWebRTC) {
    try {
      ExecutorchWebRTC.setup();
    } catch (error) {
      console.warn('Failed to initialize ExecutorchWebRTC:', error);
    }
  } else {
    console.warn(
      'ExecutorchWebRTC native module not found - is the package properly linked?'
    );
  }
}

/**
 * Configure background removal using semantic segmentation
 * @param modelPath Path to the selfie segmentation model (.pte file)
 */
export function configureBackgroundRemoval(modelPath: string): void {
  if (Platform.OS !== 'android') {
    console.warn(
      'configureBackgroundRemoval: Currently only supported on Android'
    );
    return;
  }

  const { ExecutorchWebRTC } = NativeModules;
  if (ExecutorchWebRTC) {
    console.log(
      '[ExecutorchWebRTC] Calling configureBackgroundRemoval:',
      modelPath
    );
    ExecutorchWebRTC.configureBackgroundRemoval(modelPath);
    console.log('[ExecutorchWebRTC] configureBackgroundRemoval call completed');
  } else {
    console.error(
      '[ExecutorchWebRTC] Native module not found! Is the package linked?'
    );
  }
}

/**
 * Get the current frame processing FPS
 * @returns Promise resolving to current FPS (0 if not processing)
 */
export async function getFps(): Promise<number> {
  if (Platform.OS !== 'android') {
    return 0;
  }

  const { ExecutorchWebRTC } = NativeModules;
  if (ExecutorchWebRTC) {
    return ExecutorchWebRTC.getFps();
  }
  return 0;
}

// Legacy alias
export const configureBackgroundBlur = configureBackgroundRemoval;

export {
  useWebRTCFrameProcessor,
  enableFrameProcessor,
  disableFrameProcessor,
} from './useWebRTCFrameProcessor';
