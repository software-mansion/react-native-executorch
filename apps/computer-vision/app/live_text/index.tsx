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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OCR_ENGLISH, OCRDetection, useOCR } from 'react-native-executorch';
import Svg, { Path, Polygon } from 'react-native-svg';
import ColorPalette from '../../colors';
import Spinner from '../../components/Spinner';
import ErrorBanner from '../../components/ErrorBanner';
import ScanFrame from '../../components/live_text/ScanFrame';
import ScanLine from '../../components/live_text/ScanLine';
import LiveTextOverlay from '../../components/live_text/LiveTextOverlay';
import ResultBadge from '../../components/live_text/ResultBadge';
import ShutterButton from '../../components/live_text/ShutterButton';
import { FRAME_TARGET_RESOLUTION } from '../../components/vision_camera/tasks/types';

type Phase = 'live' | 'scanning' | 'revealing' | 'result';

const REVEAL_STAGGER_MS = 70;
const REVEAL_TAIL_MS = 500;

function countWords(detections: OCRDetection[]) {
  return detections.reduce((sum, det) => {
    const words = det.text.trim().split(/\s+/).filter(Boolean);
    return sum + words.length;
  }, 0);
}

export default function LiveTextScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isFocused = useIsFocused();
  const cameraPermission = useCameraPermission();
  const devices = useCameraDevices();

  const [scanRequested] = useState(() => createSynchronizable(false));
  const [cameraPositionSync] = useState(() =>
    createSynchronizable<'front' | 'back'>('back')
  );
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>(
    'back'
  );

  const [phase, setPhase] = useState<Phase>('live');
  const [detections, setDetections] = useState<OCRDetection[]>([]);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [inferenceMs, setInferenceMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sweepDoneRef = useRef(false);
  const ocrDoneRef = useRef(false);
  const lastResultsRef = useRef<OCRDetection[]>([]);

  const model = useOCR({ model: OCR_ENGLISH });
  const ocrRof = model.runOnFrame;

  const device =
    devices.find((d) => d.position === cameraPosition) ?? devices[0];

  // Keep the camera active during `scanning` so the worklet receives at least
  // one frame to run OCR on. The ScanLine covers the preview visually.
  const cameraActive = isFocused && (phase === 'live' || phase === 'scanning');

  useEffect(() => {
    setError(model.error ? String(model.error) : null);
  }, [model.error]);

  useEffect(() => {
    cameraPositionSync.setBlocking(cameraPosition);
  }, [cameraPosition, cameraPositionSync]);

  const tryAdvanceToReveal = useCallback(() => {
    if (!sweepDoneRef.current || !ocrDoneRef.current) return;
    setPhase(lastResultsRef.current.length === 0 ? 'result' : 'revealing');
  }, []);

  const handleOcrResult = useCallback(
    (p: {
      results: OCRDetection[];
      frameW: number;
      frameH: number;
      ms: number;
    }) => {
      lastResultsRef.current = p.results;
      setDetections(p.results);
      setImageSize({ width: p.frameW, height: p.frameH });
      setInferenceMs(p.ms);
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
    setInferenceMs(0);
    setError(null);
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
          const start = Date.now();
          const result = ocrRof(frame, isFrontCamera);
          const ms = Date.now() - start;
          if (result) {
            // Sensor frames are landscape-native, so width/height are
            // swapped relative to portrait screen orientation.
            scheduleOnRN(handleOcrResult, {
              results: result,
              frameW: frame.height,
              frameH: frame.width,
              ms,
            });
          }
        } catch {
          // Frame may be disposed before processing completes — transient.
        } finally {
          frame.dispose();
        }
      },
      [cameraPositionSync, handleOcrResult, ocrRof, scanRequested]
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

  const wordCount = countWords(detections);

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
        style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 8 }]}
          onPress={() => router.navigate('/')}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.titleRow} pointerEvents="none">
          <Text style={styles.title}>Live Text</Text>
        </View>
      </View>

      {phase === 'result' && (
        <View
          style={[styles.badgeWrap, { top: insets.top + 64 }]}
          pointerEvents="none"
        >
          <ResultBadge
            wordCount={wordCount}
            inferenceMs={inferenceMs}
            empty={detections.length === 0}
          />
        </View>
      )}

      <View
        style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 24 }]}
        pointerEvents="box-none"
      >
        {phase === 'live' && (
          <View style={styles.bottomRow}>
            <ShutterButton variant="shutter" onPress={startScan} />
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() =>
                setCameraPosition((p) => (p === 'back' ? 'front' : 'back'))
              }
            >
              <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                  stroke="white"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M9 13.5a3 3 0 1 0 3-3"
                  stroke="white"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                <Polygon points="8,11 9,13.5 11,12" fill="white" />
              </Svg>
            </TouchableOpacity>
          </View>
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
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
    zIndex: 5,
  },
  titleRow: { alignItems: 'center', paddingHorizontal: 16 },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  badgeWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 50,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  flipButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  backButton: {
    position: 'absolute',
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    zIndex: 10,
  },
});
