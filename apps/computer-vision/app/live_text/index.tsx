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
import * as Clipboard from 'expo-clipboard';
import { OCR_ENGLISH, OCRDetection, useOCR } from 'react-native-executorch';
import Svg, { Path, Polygon } from 'react-native-svg';
import ColorPalette from '../../colors';
import Spinner from '../../components/Spinner';
import ErrorBanner from '../../components/ErrorBanner';
import ScanFrame from '../../components/live_text/ScanFrame';
import LiveTextOverlay from '../../components/live_text/LiveTextOverlay';
import CopyToast from '../../components/live_text/CopyToast';
import { FRAME_TARGET_RESOLUTION } from '../../components/vision_camera/tasks/types';

export default function LiveTextScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isFocused = useIsFocused();
  const cameraPermission = useCameraPermission();
  const devices = useCameraDevices();

  const [frameKillSwitch] = useState(() => createSynchronizable(false));
  const [cameraPositionSync] = useState(() =>
    createSynchronizable<'front' | 'back'>('back')
  );
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>(
    'back'
  );

  const [detections, setDetections] = useState<OCRDetection[]>([]);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [fps, setFps] = useState(0);
  const [frameMs, setFrameMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; id: number }>({
    message: '',
    id: 0,
  });
  const lastFrameTimeRef = useRef(Date.now());

  const model = useOCR({ model: OCR_ENGLISH });
  const ocrRof = model.runOnFrame;

  const device =
    devices.find((d) => d.position === cameraPosition) ?? devices[0];

  useEffect(() => {
    setError(model.error ? String(model.error) : null);
  }, [model.error]);

  useEffect(() => {
    cameraPositionSync.setBlocking(cameraPosition);
  }, [cameraPosition, cameraPositionSync]);

  useEffect(() => {
    frameKillSwitch.setBlocking(true);
    const id = setTimeout(() => frameKillSwitch.setBlocking(false), 300);
    return () => clearTimeout(id);
  }, [frameKillSwitch]);

  const updateDetections = useCallback(
    (p: { results: OCRDetection[]; frameW: number; frameH: number }) => {
      setDetections(p.results);
      setImageSize({ width: p.frameW, height: p.frameH });
      const now = Date.now();
      const diff = now - lastFrameTimeRef.current;
      if (diff > 0) {
        setFps(Math.round(1000 / diff));
        setFrameMs(diff);
      }
      lastFrameTimeRef.current = now;
    },
    []
  );

  const handleCopy = useCallback((text: string) => {
    Clipboard.setStringAsync(text)
      .then(() => setToast({ message: text, id: Date.now() }))
      .catch(() => {
        // Best-effort copy — stay silent on failure.
      });
  }, []);

  const frameOutput = useFrameOutput({
    targetResolution: FRAME_TARGET_RESOLUTION,
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    enablePreviewSizedOutputBuffers: true,
    onFrame: useCallback(
      (frame: Frame) => {
        'worklet';
        if (frameKillSwitch.getDirty()) {
          frame.dispose();
          return;
        }
        try {
          if (!ocrRof) return;
          const isFrontCamera = cameraPositionSync.getDirty() === 'front';
          const result = ocrRof(frame, isFrontCamera);
          if (result) {
            // Sensor frames are landscape-native, so width/height are
            // swapped relative to portrait screen orientation.
            scheduleOnRN(updateDetections, {
              results: result,
              frameW: frame.height,
              frameH: frame.width,
            });
          }
        } catch {
          // Frame may be disposed before processing completes — transient.
        } finally {
          frame.dispose();
        }
      },
      [cameraPositionSync, frameKillSwitch, ocrRof, updateDetections]
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
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      </View>

      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        outputs={frameOutput ? [frameOutput] : []}
        isActive={isFocused}
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

      <LiveTextOverlay
        detections={detections}
        imageSize={imageSize}
        canvasSize={canvasSize}
        onCopy={handleCopy}
      />

      <ScanFrame />

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
          <Text style={styles.fpsText}>
            {fps} FPS – {frameMs.toFixed(0)} ms
          </Text>
        </View>
      </View>

      <View
        style={[styles.toastWrap, { top: insets.top + 92 }]}
        pointerEvents="none"
      >
        <CopyToast key={toast.id} message={toast.message} />
      </View>

      <View
        style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 16 }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.flipButton}
          onPress={() =>
            setCameraPosition((p) => (p === 'back' ? 'front' : 'back'))
          }
        >
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
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
  fpsText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  toastWrap: {
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
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
