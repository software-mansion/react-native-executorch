import { useEffect } from 'react';
import { Platform, DeviceEventEmitter } from 'react-native';
import type { MediaStream, MediaStreamTrack } from 'react-native-webrtc';

export const PROCESSOR_NAMES = {
  default: 'executorchBackgroundBlur',
  experimental: 'executorchBackgroundBlurNew',
} as const;

export type ProcessorName =
  (typeof PROCESSOR_NAMES)[keyof typeof PROCESSOR_NAMES];

/**
 * Result from frame processing
 */
export interface FrameProcessingResult {
  result: string; // JSON string with detection results
  width: number;
  height: number;
  timestamp: number;
}

/**
 * Options for frame processor
 */
export interface WebRTCFrameProcessorOptions {
  enabled?: boolean;
  onResults?: (results: FrameProcessingResult) => void;
  /** Which processor to use. Defaults to 'executorchBackgroundBlur' */
  processorName?: ProcessorName | string;
}

/**
 * Hook to enable ExecuTorch frame processing on a WebRTC video track.
 *
 * @param stream - The MediaStream containing the video track to process
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const stream = await mediaDevices.getUserMedia({ video: true });
 * useWebRTCFrameProcessor(stream, {
 *   onResults: (results) => {
 *     console.log('Detections:', JSON.parse(results.result));
 *   }
 * });
 * ```
 */
export function useWebRTCFrameProcessor(
  stream: MediaStream | null | undefined,
  options: WebRTCFrameProcessorOptions = {}
): void {
  const {
    enabled = true,
    onResults,
    processorName = PROCESSOR_NAMES.default,
  } = options;
  useEffect(() => {
    if (!stream || !enabled) {
      return;
    }

    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
      console.warn('useWebRTCFrameProcessor: No video tracks found in stream');
      return;
    }

    const videoTrack = videoTracks[0];
    if (!videoTrack) {
      return;
    }

    // Set up event listener for results
    const subscription = onResults
      ? DeviceEventEmitter.addListener(
          'onFrameProcessed',
          (event: FrameProcessingResult) => {
            onResults(event);
          }
        )
      : null;

    try {
      const track = videoTrack as any;
      if (typeof track._setVideoEffects === 'function') {
        track._setVideoEffects([processorName]);
        console.log(
          `✅ ExecuTorch frame processor "${processorName}" enabled on track ${videoTrack.id}`
        );
      } else {
        console.warn('useWebRTCFrameProcessor: _setVideoEffects not available');
      }
    } catch (error) {
      console.error(
        'useWebRTCFrameProcessor: Failed to enable processor:',
        error
      );
    }

    // Cleanup: disable processor when unmounting
    return () => {
      subscription?.remove();

      try {
        const track = videoTrack as any;
        if (typeof track._setVideoEffects === 'function') {
          track._setVideoEffects([]);
          console.log(
            `ExecuTorch frame processor disabled on track ${videoTrack.id}`
          );
        }
      } catch (error) {
        console.error(
          'useWebRTCFrameProcessor: Failed to disable processor:',
          error
        );
      }
    };
  }, [stream, enabled, onResults, processorName]);
}

/**
 * Manually enable ExecuTorch frame processing on a video track.
 *
 * @param videoTrack - The video track to process
 * @param processorName - Which processor to use (default: 'executorchBackgroundBlur')
 *
 * @example
 * ```tsx
 * const stream = await mediaDevices.getUserMedia({ video: true });
 * const track = stream.getVideoTracks()[0];
 * enableFrameProcessor(track);
 * // or use experimental:
 * enableFrameProcessor(track, PROCESSOR_NAMES.experimental);
 * ```
 */
export function enableFrameProcessor(
  videoTrack: MediaStreamTrack,
  processorName: ProcessorName | string = PROCESSOR_NAMES.default
): void {
  if (Platform.OS !== 'android') {
    console.warn('enableFrameProcessor: Currently only supported on Android');
    return;
  }

  try {
    const track = videoTrack as any;
    if (typeof track._setVideoEffects === 'function') {
      track._setVideoEffects([processorName]);
      console.log(
        `✅ ExecuTorch frame processor "${processorName}" enabled on track ${videoTrack.id}`
      );
    }
  } catch (error) {
    console.error('enableFrameProcessor: Failed to enable processor:', error);
    throw error;
  }
}

/**
 * Manually disable ExecuTorch frame processing on a video track.
 *
 * @param videoTrack - The video track to stop processing
 */
export function disableFrameProcessor(videoTrack: MediaStreamTrack): void {
  try {
    const track = videoTrack as any;
    if (typeof track._setVideoEffects === 'function') {
      track._setVideoEffects([]);
      console.log(
        `ExecuTorch frame processor disabled on track ${videoTrack.id}`
      );
    }
  } catch (error) {
    console.error('disableFrameProcessor: Failed to disable processor:', error);
    throw error;
  }
}
