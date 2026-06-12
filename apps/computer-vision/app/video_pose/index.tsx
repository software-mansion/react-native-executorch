import Spinner from '../../components/Spinner';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Asset } from 'expo-asset';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../../ScreenWrapper';
import ErrorBanner from '../../components/ErrorBanner';
import { fps as sourceFps, frames } from '../../assets/video_frames';
import ExecutorchLogo from '../../assets/icons/executorch.svg';

// Fallback playback pacing when the bundled frames carry no fps.
const PLAYBACK_FPS = 30;

const fmtTime = (frameIndex: number, fps: number) => {
  const totalSeconds = frameIndex / fps;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

// Plays a prerecorded clip (bundled as frames, overlays already baked in)
// in a video-player UI: play/pause plus a scrubbable timeline. No inference
// happens here.
export default function VideoPoseScreen() {
  const [frameUris, setFrameUris] = useState<string[]>([]);
  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);

  const router = useRouter();
  // The video stays full-bleed; only the overlaid chrome (back button, HUD,
  // controls) is inset away from the notch and home indicator.
  const insets = useSafeAreaInsets();

  // The playback loop is a long-lived async function; the ref lets it react
  // to pause/unmount between awaits.
  const playingRef = useRef(false);
  const frameIndexRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (frames.length === 0) return;
      try {
        const assets = await Asset.loadAsync(frames);
        if (cancelled) return;
        const uris = assets.map((a) => a.localUri ?? a.uri);
        setFrameUris(uris);
        setCurrentUri(uris[0] ?? null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      playingRef.current = false;
    };
  }, []);

  /*
    *
  // The rest of the app is portrait-locked; this screen goes landscape while
  // focused since the bundled clip is horizontal.
  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      ).catch(() => {});
      return () => {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        ).catch(() => {});
      };
    }, [])
  );

  const stopPlayback = useCallback(() => {
    playingRef.current = false;
    setIsPlaying(false);
  }, []);

  const seekTo = useCallback(
    (index: number) => {
      frameIndexRef.current = index;
      setCurrentIndex(index);
      setCurrentUri(frameUris[index] ?? null);
    },
    [frameUris]
  );

  const indexForX = useCallback(
    (x: number) => {
      if (trackWidth <= 0 || frameUris.length === 0) return 0;
      const ratio = Math.min(Math.max(x / trackWidth, 0), 1);
      return Math.round(ratio * (frameUris.length - 1));
    },
    [trackWidth, frameUris.length]
  );

  const handleScrubStart = useCallback(
    (x: number) => {
      setIsScrubbing(true);
      stopPlayback();
      seekTo(indexForX(x));
    },
    [stopPlayback, seekTo, indexForX]
  );

  const handleScrubMove = useCallback(
    (x: number) => {
      seekTo(indexForX(x));
    },
    [seekTo, indexForX]
  );

  const handleScrubEnd = useCallback(
    (x: number) => {
      setIsScrubbing(false);
      seekTo(indexForX(x));
    },
    [indexForX, seekTo]
  );

  const scrubGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .hitSlop({ top: 16, bottom: 16 })
        .onBegin((e) => {
          scheduleOnRN(handleScrubStart, e.x);
        })
        .onUpdate((e) => {
          scheduleOnRN(handleScrubMove, e.x);
        })
        .onFinalize((e) => {
          scheduleOnRN(handleScrubEnd, e.x);
        }),
    [handleScrubStart, handleScrubMove, handleScrubEnd]
  );

  const playLoop = useCallback(async (urisToPlay: string[]) => {
    const fps = sourceFps > 0 ? sourceFps : PLAYBACK_FPS;
    const targetFrameMs = 1000 / fps;
    while (playingRef.current) {
      const frameIndex = frameIndexRef.current;
      const start = Date.now();
      setCurrentUri(urisToPlay[frameIndex]!);
      setCurrentIndex(frameIndex);
      const elapsed = Date.now() - start;
      if (elapsed < targetFrameMs) {
        await new Promise((resolve) =>
          setTimeout(resolve, targetFrameMs - elapsed)
        );
      }
      frameIndexRef.current = (frameIndexRef.current + 1) % urisToPlay.length;
    }
  }, []);

  const startPlayback = useCallback(() => {
    if (playingRef.current || frameUris.length === 0) return;
    playingRef.current = true;
    setIsPlaying(true);
    playLoop(frameUris);
  }, [frameUris, playLoop]);

  if (frames.length > 0 && frameUris.length === 0 && !error) {
    return <Spinner visible textContent="Loading video frames..." />;
  }

  const fps = sourceFps > 0 ? sourceFps : PLAYBACK_FPS;
  const progressRatio =
    frameUris.length > 1 ? currentIndex / (frameUris.length - 1) : 0;
  const thumbX = progressRatio * trackWidth;

  return (
    <ScreenWrapper>
      <View style={styles.root}>
        {currentUri && (
          <Image
            style={styles.video}
            // The whole frame stays visible in either orientation.
            resizeMode="contain"
            fadeDuration={0}
            source={{ uri: currentUri }}
          />
        )}
        {frames.length === 0 && (
          <View style={styles.infoOverlay} pointerEvents="none">
            <Text style={styles.infoTitle}>Video Pose</Text>
            <Text style={styles.infoText}>
              No video frames bundled. Extract frames from an mp4, then
              rebuild the app:
            </Text>
            <Text style={styles.codeText}>
              node scripts/extract-video-frames.mjs ~/video.mp4 --fps 30
            </Text>
          </View>
        )}
        {frameUris.length > 0 && (
          <View
            style={[styles.topOverlay, { top: insets.top + 8 }]}
            pointerEvents="none"
          >
            <View style={styles.hudChip}>
              <View style={styles.glassHighlight} pointerEvents="none" />
              <ExecutorchLogo width={22} height={22} />
              <View>
                <Text style={styles.hudText}>
                  Frame {currentIndex + 1}/{frameUris.length}
                </Text>
                <Text style={styles.hudSubText}>
                  Made with React Native ExecuTorch
                </Text>
              </View>
            </View>
          </View>
        )}

        {frameUris.length > 0 && (
          <View
            style={[
              styles.controlsBar,
              {
                left: insets.left + 24,
                right: insets.right + 24,
                bottom: insets.bottom + 16,
              },
            ]}
          >
            <View style={styles.glassHighlight} pointerEvents="none" />
            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={isPlaying ? stopPlayback : startPlayback}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={22}
                color="white"
                // The play triangle reads off-center inside a circle.
                style={isPlaying ? undefined : styles.playIconNudge}
              />
            </TouchableOpacity>

            <Text style={styles.timeText}>{fmtTime(currentIndex, fps)}</Text>

            <GestureDetector gesture={scrubGesture}>
              <View
                style={styles.seekTrackHitArea}
                onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
              >
                <View style={styles.seekTrack}>
                  <View
                    style={[styles.seekFill, { width: thumbX }]}
                    pointerEvents="none"
                  />
                </View>
                <View
                  style={[
                    styles.seekThumb,
                    isScrubbing && styles.seekThumbActive,
                    { left: thumbX },
                  ]}
                  pointerEvents="none"
                />
              </View>
            </GestureDetector>

            <Text style={styles.timeText}>
              {fmtTime(frameUris.length - 1, fps)}
            </Text>
          </View>
        )}

        <View style={[styles.errorOverlay, { top: insets.top }]}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </View>
        <TouchableOpacity
          style={[
            styles.backButton,
            { top: insets.top + 12, left: insets.left + 12 },
          ]}
          onPress={() => {
            stopPlayback();
            router.navigate('/');
          }}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const THUMB_SIZE = 18;
const THUMB_SIZE_ACTIVE = 24;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'black',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  errorOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
  },
  backButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  topOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hudChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.45)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  hudText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  hudSubText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    marginTop: 1,
  },
  controlsBar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.45)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  // Bright top edge inside the pill, the cheap stand-in for a refraction
  // highlight on real glass.
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  playPauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconNudge: {
    marginLeft: 3,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    fontVariant: ['tabular-nums'],
    minWidth: 34,
    textAlign: 'center',
  },
  seekTrackHitArea: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
  },
  seekTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  seekFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  seekThumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    marginLeft: -THUMB_SIZE / 2,
    backgroundColor: 'white',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  seekThumbActive: {
    width: THUMB_SIZE_ACTIVE,
    height: THUMB_SIZE_ACTIVE,
    borderRadius: THUMB_SIZE_ACTIVE / 2,
    marginLeft: -THUMB_SIZE_ACTIVE / 2,
  },
  infoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  codeText: {
    fontSize: 12,
    color: '#ddd',
    fontFamily: 'Courier',
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 8,
    borderRadius: 4,
  },
});
