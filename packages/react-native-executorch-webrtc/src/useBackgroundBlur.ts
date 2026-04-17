import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import NativeBackgroundBlur from './NativeBackgroundBlur';
import {
  initializeBackgroundBlur,
  deinitializeBackgroundBlur,
} from './BackgroundBlur';

/**
 * Extended MediaStreamTrack with WebRTC video effects API
 */
type NativeMediaStreamTrack = MediaStreamTrack & {
  _setVideoEffect: (name: string) => void;
  _setVideoEffects: (names: string[] | null) => void;
};

/**
 * Middleware function type compatible with Fishjam SDK
 */
export type TrackMiddleware = (track: MediaStreamTrack) => {
  track: MediaStreamTrack;
  onClear: () => void;
};

/**
 * Options for useBackgroundBlur hook
 */
export type UseBackgroundBlurOptions = {
  /**
   * Path to the ExecuTorch segmentation model (.pte file)
   * Required for initialization
   */
  modelUri: string;

  /**
   * Blur intensity/radius (default: 12)
   */
  blurRadius?: number;
};

const PROCESSOR_NAME = 'executorchBackgroundBlur';

/**
 * Hook to enable background blur on WebRTC video tracks.
 * Compatible with Fishjam SDK's TrackMiddleware interface.
 * @param options Configuration options including model path and blur radius
 * @returns Object containing blurMiddleware for use with Fishjam SDK
 * @example
 * ```tsx
 * import { useBackgroundBlur } from '@executorch/react-native-executorch-webrtc';
 *
 * function VideoCall() {
 *   const { blurMiddleware } = useBackgroundBlur({
 *     modelUri: 'file:///path/to/selfie_segmenter.pte',
 *     blurRadius: 15,
 *   });
 *
 *   // Use with Fishjam SDK
 *   const { toggleCamera } = useCamera({
 *     cameraTrackMiddleware: blurMiddleware,
 *   });
 *
 *   // Or use directly with a track
 *   const applyBlur = (track: MediaStreamTrack) => {
 *     const { onClear } = blurMiddleware(track);
 *     // Call onClear() to remove the effect
 *   };
 * }
 * ```
 */
export function useBackgroundBlur(options: UseBackgroundBlurOptions): {
  blurMiddleware: TrackMiddleware;
} {
  const { modelUri, blurRadius = 12 } = options;
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!NativeBackgroundBlur) {
      console.warn('[useBackgroundBlur] Native module not available');
      return;
    }

    if (!initializedRef.current && modelUri) {
      initializeBackgroundBlur(modelUri);
      initializedRef.current = true;
    }

    return () => {
      deinitializeBackgroundBlur();
      initializedRef.current = false;
    };
  }, [modelUri]);

  // Update blur radius when it changes
  useEffect(() => {
    if (!NativeBackgroundBlur) {
      console.warn('[useBackgroundBlur] Native module not available');
      return;
    }

    NativeBackgroundBlur.setBlurRadius(blurRadius);
  }, [blurRadius]);

  const blurMiddleware: TrackMiddleware = useCallback(
    (track: MediaStreamTrack) => {
      const nativeTrack = track as NativeMediaStreamTrack;

      // Apply the video effect
      nativeTrack._setVideoEffect(PROCESSOR_NAME);

      return {
        track,
        onClear: () => {
          // Android expects null to disable, iOS expects empty array
          nativeTrack._setVideoEffects(
            Platform.OS === 'ios' ? [] : (null as any)
          );
        },
      };
    },
    []
  );

  return { blurMiddleware };
}
