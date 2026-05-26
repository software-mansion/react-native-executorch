import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import {
  Camera,
  Frame,
  useCameraDevices,
  useCameraPermission,
  useFrameOutput,
} from 'react-native-vision-camera';
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets';
import { LinearGradient } from 'expo-linear-gradient';
import { OCR_ENGLISH, OCRDetection, useOCR } from 'react-native-executorch';
import ColorPalette from '../../colors';
import Spinner from '../../components/Spinner';
import ErrorBanner from '../../components/ErrorBanner';
import ScanFrame from '../../components/live_text/ScanFrame';
import ScanLine from '../../components/live_text/ScanLine';
import LiveTextOverlay from '../../components/live_text/LiveTextOverlay';
import ShutterButton from '../../components/live_text/ShutterButton';
import { FRAME_TARGET_RESOLUTION } from '../../components/vision_camera/tasks/types';

type Phase = 'live' | 'scanning' | 'revealing' | 'result';

// Must match `STAGGER_MS` in LiveTextOverlay; the tail timer relies on it
// to schedule the transition into the "result" phase.
const REVEAL_STAGGER_MS = 80;
const REVEAL_TAIL_MS = 650;

export default function LiveTextScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const cameraPermission = useCameraPermission();
  const devices = useCameraDevices();

  const [scanRequested] = useState(() => createSynchronizable(false));
  const [cameraPositionSync] = useState(() =>
    createSynchronizable<'front' | 'back'>('back')
  );
  const [phase, setPhase] = useState<Phase>('live');
  const [detections, setDetections] = useState<OCRDetection[]>([]);
  // imageSize holds the engine's portrait-space dims (sensor H × sensor W).
  // The overlay rotates bboxes + dims into the display orientation.
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [frameOrientation, setFrameOrientation] = useState<
    'up' | 'down' | 'left' | 'right'
  >('left');
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [error, setError] = useState<string | null>(null);

  const sweepDoneRef = useRef(false);
  const ocrDoneRef = useRef(false);
  const lastResultsRef = useRef<OCRDetection[]>([]);

  const model = useOCR({ model: OCR_ENGLISH });
  const ocrRof = model.runOnFrame;

  const device = devices.find((d) => d.position === 'back') ?? devices[0];

  // Keep the camera active during `scanning` so the worklet receives at least
  // one frame to run OCR on. The ScanLine covers the preview visually.
  const cameraActive = isFocused && (phase === 'live' || phase === 'scanning');

  useEffect(() => {
    setError(model.error ? String(model.error) : null);
  }, [model.error]);

  const tryAdvanceToReveal = useCallback(() => {
    if (!sweepDoneRef.current || !ocrDoneRef.current) return;
    setPhase(lastResultsRef.current.length === 0 ? 'result' : 'revealing');
  }, []);

  const handleOcrResult = useCallback(
    (p: {
      results: OCRDetection[];
      frameW: number;
      frameH: number;
      orientation: 'up' | 'down' | 'left' | 'right';
    }) => {
      lastResultsRef.current = p.results;
      setDetections(p.results);
      setImageSize({ width: p.frameW, height: p.frameH });
      setFrameOrientation(p.orientation);
      ocrDoneRef.current = true;
      tryAdvanceToReveal();
    },
    [tryAdvanceToReveal]
  );

  const handleSweepDone = useCallback(() => {
    sweepDoneRef.current = true;
    tryAdvanceToReveal();
  }, [tryAdvanceToReveal]);

  // revealing -> result after the staggered boxes finish springing in.
  useEffect(() => {
    if (phase !== 'revealing') return;
    const tail = detections.length * REVEAL_STAGGER_MS + REVEAL_TAIL_MS;
    const id = setTimeout(() => setPhase('result'), tail);
    return () => clearTimeout(id);
  }, [phase, detections.length]);

  const startScan = useCallback(() => {
    if (!ocrRof) return;
    sweepDoneRef.current = false;
    ocrDoneRef.current = false;
    lastResultsRef.current = [];
    setDetections([]);
    setError(null);
    setPhase('scanning');
    scanRequested.setBlocking(true);
  }, [ocrRof, scanRequested]);

  const resetToLive = useCallback(() => {
    setDetections([]);
    setError(null);
    setPhase('live');
  }, []);

  const handleOcrError = useCallback((msg: string) => {
    console.warn('[LiveText] OCR worklet error:', msg);
    sweepDoneRef.current = false;
    ocrDoneRef.current = false;
    setError(msg);
    setDetections([]);
    setPhase('live');
  }, []);

  const frameOutput = useFrameOutput({
    targetResolution: FRAME_TARGET_RESOLUTION,
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    enablePreviewSizedOutputBuffers: true,
    onFrame: useCallback(
      (frame: Frame) => {
        'worklet';
        try {
          if (!ocrRof) return;
          if (!scanRequested.getDirty()) return;
          // Consume the scan request so OCR runs exactly once per tap.
          scanRequested.setBlocking(false);
          const isFrontCamera = cameraPositionSync.getDirty() === 'front';
          const result = ocrRof(frame, isFrontCamera);
          if (result) {
            // The OCR engine always returns bboxes in portrait-screen space
            // (sensor H × sensor W). The overlay rotates them into the
            // current display orientation using `orientation`.
            scheduleOnRN(handleOcrResult, {
              results: result,
              frameW: frame.height,
              frameH: frame.width,
              orientation: frame.orientation,
            });
          }
        } catch (e) {
          // Frame may be disposed before processing completes — transient. But if
          // ocrRof itself threw, scanRequested was already consumed; we must
          // surface the error to the JS thread so the UI can recover.
          scheduleOnRN(handleOcrError, String(e));
        } finally {
          frame.dispose();
        }
      },
      [
        cameraPositionSync,
        handleOcrError,
        handleOcrResult,
        ocrRof,
        scanRequested,
      ]
    ),
  });

  if (!cameraPermission.hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Camera access needed</Text>
        <TouchableOpacity
          onPress={() => cameraPermission.requestPermission()}
          style={styles.permButton}
        >
          <Text style={styles.permButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      <View style={[styles.errorOverlay, { paddingTop: insets.top }]}>
        <ErrorBanner
          message={error}
          onDismiss={() => {
            setError(null);
            resetToLive();
          }}
        />
      </View>

      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        outputs={frameOutput ? [frameOutput] : []}
        isActive={cameraActive}
        orientationSource="device"
        onError={(e) => {
          console.warn('[Camera] onError', e);
          setError(e.message);
        }}
      />

      {/* Cinematic vignette: top + bottom gradients darken the edges and
        give the shutter button a legible backdrop. */}
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
        style={styles.vignetteTop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
        style={styles.vignetteBottom}
        pointerEvents="none"
      />

      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        onLayout={(e) =>
          setCanvasSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      />

      {(phase === 'revealing' || phase === 'result') && (
        <LiveTextOverlay
          detections={detections}
          imageSize={imageSize}
          orientation={frameOrientation}
          canvasSize={canvasSize}
          revealActive={phase === 'revealing'}
        />
      )}

      {phase === 'live' && <ScanFrame />}

      {phase === 'scanning' && (
        <ScanLine height={canvasSize.height} onSweepDone={handleSweepDone} />
      )}

      {!model.isReady && !error && (
        <View style={styles.loadingOverlay}>
          <Spinner
            visible
            textContent={`Loading OCR ${(model.downloadProgress * 100).toFixed(0)}%`}
          />
        </View>
      )}

      <View
        style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 24 }]}
        pointerEvents="box-none"
      >
        {phase === 'live' && (
          <ShutterButton variant="shutter" onPress={startScan} />
        )}
        {phase === 'result' && (
          <ShutterButton variant="again" onPress={resetToLive} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  centered: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  message: { color: 'white', fontSize: 18 },
  permButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: ColorPalette.primary,
    borderRadius: 24,
  },
  permButtonText: { color: 'white', fontSize: 15, fontWeight: '600' },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    zIndex: 1,
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    zIndex: 1,
  },
});
