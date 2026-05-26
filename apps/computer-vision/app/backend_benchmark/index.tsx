import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Camera, Frame, useFrameOutput } from 'react-native-vision-camera';
import {
  useCameraDevices,
  useCameraPermission,
} from 'react-native-vision-camera';
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets';
import {
  CocoLabel,
  Detection,
  useObjectDetection,
} from 'react-native-executorch';
import BoundingBoxes from '../../components/BoundingBoxes';
import { FRAME_TARGET_RESOLUTION } from '../../components/vision_camera/tasks/types';

// ─────────────────────────────────────────────────────────────────────────
// Flip this one line between recordings to switch the inference backend.
const BACKEND: 'coreml' | 'xnnpack' = 'xnnpack';
// ─────────────────────────────────────────────────────────────────────────

const SSDLITE_URL = {
  coreml:
    'https://huggingface.co/software-mansion/react-native-executorch-ssdlite320-mobilenet-v3-large/resolve/v0.8.0/coreml/ssdlite320_mobilenet_v3_large_coreml_fp16.pte',
  xnnpack:
    'https://huggingface.co/software-mansion/react-native-executorch-ssdlite320-mobilenet-v3-large/resolve/v0.8.0/xnnpack/ssdlite320_mobilenet_v3_large_xnnpack_fp32.pte',
} as const;

// Number of recent frames averaged for the displayed FPS so the big number
// stays steady on screen instead of flickering frame to frame.
const FPS_WINDOW = 30;

// ── Bounding-box temporal smoothing ──────────────────────────────────────
// Low-pass factor for box coordinates (0 = frozen, 1 = no smoothing). Lower
// is steadier but lags fast motion.
const SMOOTHING = 0.35;
// IoU above which a new detection is considered the same object as a tracked
// one (so its position can be smoothed instead of popping a fresh box).
const MATCH_IOU = 0.3;
// How many consecutive frames a tracked box may go unmatched before it is
// removed — absorbs brief detector dropouts so boxes don't blink.
const MAX_MISSES = 6;

type Bbox = { x1: number; y1: number; x2: number; y2: number };

type TrackedBox = {
  id: number;
  label: string;
  score: number;
  bbox: Bbox;
  misses: number;
};

function iou(a: Bbox, b: Bbox) {
  const ix1 = Math.max(a.x1, b.x1);
  const iy1 = Math.max(a.y1, b.y1);
  const ix2 = Math.min(a.x2, b.x2);
  const iy2 = Math.min(a.y2, b.y2);
  const iw = Math.max(0, ix2 - ix1);
  const ih = Math.max(0, iy2 - iy1);
  const inter = iw * ih;
  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  const union = areaA + areaB - inter;
  return union > 0 ? inter / union : 0;
}

// cspell:ignore lerp
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothBbox(prev: Bbox, next: Bbox): Bbox {
  return {
    x1: lerp(prev.x1, next.x1, SMOOTHING),
    y1: lerp(prev.y1, next.y1, SMOOTHING),
    x2: lerp(prev.x2, next.x2, SMOOTHING),
    y2: lerp(prev.y2, next.y2, SMOOTHING),
  };
}

// Match raw detections to the previously tracked boxes (greedy by IoU within
// the same label), smoothing matched positions and aging out boxes that go
// unmatched for too long. Produces stable, non-flashy boxes for display.
function reconcile(
  tracked: TrackedBox[],
  raw: { label: string; score: number; bbox: Bbox }[],
  nextId: { current: number }
): TrackedBox[] {
  const usedTracked = new Set<number>();
  const result: TrackedBox[] = [];

  // Match each raw detection to the best available tracked box.
  for (const det of raw) {
    let bestIdx = -1;
    let bestIou = MATCH_IOU;
    for (let i = 0; i < tracked.length; i++) {
      if (usedTracked.has(i)) continue;
      if (tracked[i]!.label !== det.label) continue;
      const score = iou(tracked[i]!.bbox, det.bbox);
      if (score > bestIou) {
        bestIou = score;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      const t = tracked[bestIdx]!;
      usedTracked.add(bestIdx);
      result.push({
        id: t.id,
        label: det.label,
        score: det.score,
        bbox: smoothBbox(t.bbox, det.bbox),
        misses: 0,
      });
    } else {
      result.push({
        id: nextId.current++,
        label: det.label,
        score: det.score,
        bbox: det.bbox,
        misses: 0,
      });
    }
  }

  // Keep recently-seen tracked boxes that weren't matched this frame, so a
  // momentary detector miss doesn't make the box disappear.
  for (let i = 0; i < tracked.length; i++) {
    if (usedTracked.has(i)) continue;
    const t = tracked[i]!;
    if (t.misses + 1 < MAX_MISSES) {
      result.push({ ...t, misses: t.misses + 1 });
    }
  }

  return result;
}

export default function BackendBenchmarkScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const cameraPermission = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back') ?? devices[0];

  const [cameraPositionSync] = useState(() =>
    createSynchronizable<'front' | 'back'>('back')
  );

  const model = useObjectDetection({
    model: {
      modelName: 'ssdlite-320-mobilenet-v3-large',
      modelSource: SSDLITE_URL[BACKEND],
    },
  });
  const detRof = model.runOnFrame;

  type CommonDetection = Omit<Detection, 'label'> & { label: string };
  const [detections, setDetections] = useState<CommonDetection[]>([]);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [fps, setFps] = useState(0);
  const [frameMs, setFrameMs] = useState(0);

  const lastFrameTimeRef = useRef(Date.now());
  const msWindowRef = useRef<number[]>([]);
  const trackedRef = useRef<TrackedBox[]>([]);
  const nextIdRef = useRef(0);

  const updateDetections = useCallback(
    (p: {
      results: Detection<typeof CocoLabel>[];
      imageWidth: number;
      imageHeight: number;
    }) => {
      const raw = p.results.map((det) => ({
        label: String(det.label),
        score: det.score,
        bbox: det.bbox,
      }));
      const next = reconcile(trackedRef.current, raw, nextIdRef);
      trackedRef.current = next;
      setDetections(
        next.map((t) => ({ label: t.label, score: t.score, bbox: t.bbox }))
      );
      setImageSize({ width: p.imageWidth, height: p.imageHeight });

      const now = Date.now();
      const diff = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;
      if (diff <= 0) return;

      const win = msWindowRef.current;
      win.push(diff);
      if (win.length > FPS_WINDOW) win.shift();
      const avgMs = win.reduce((a, b) => a + b, 0) / win.length;
      setFps(Math.round(1000 / avgMs));
      setFrameMs(Math.round(avgMs));
    },
    []
  );

  const frameOutput = useFrameOutput({
    targetResolution: FRAME_TARGET_RESOLUTION,
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    enablePreviewSizedOutputBuffers: true,
    onFrame: useCallback(
      (frame: Frame) => {
        'worklet';
        try {
          if (!detRof) return;
          const isFrontCamera = cameraPositionSync.getDirty() === 'front';
          const result = detRof(frame, isFrontCamera, {
            detectionThreshold: 0.5,
          });
          // Sensor frames are landscape-native, so width/height are swapped
          // relative to portrait screen orientation.
          const screenW = frame.height;
          const screenH = frame.width;
          if (result) {
            scheduleOnRN(updateDetections, {
              results: result,
              imageWidth: screenW,
              imageHeight: screenH,
            });
          }
        } catch {
          // Frame may be disposed before processing completes — transient.
        } finally {
          frame.dispose();
        }
      },
      [cameraPositionSync, detRof, updateDetections]
    ),
  });

  useEffect(() => {
    // Reset the rolling window and tracker whenever the model (backend) reloads.
    msWindowRef.current = [];
    trackedRef.current = [];
    setFps(0);
    setFrameMs(0);
  }, [model.isReady]);

  if (!cameraPermission.hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Camera access needed</Text>
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

  const scale = Math.max(
    canvasSize.width / imageSize.width,
    canvasSize.height / imageSize.height
  );
  const offsetX = (canvasSize.width - imageSize.width * scale) / 2;
  const offsetY = (canvasSize.height - imageSize.height * scale) / 2;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        outputs={frameOutput ? [frameOutput] : []}
        isActive={isFocused}
        orientationSource="device"
        constraints={[{ fps: 120 }]}
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

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BoundingBoxes
          detections={detections}
          scaleX={scale}
          scaleY={scale}
          offsetX={offsetX}
          offsetY={offsetY}
          containerWidth={canvasSize.width}
        />
      </View>

      <View
        style={[styles.readout, { top: insets.top + 16 }]}
        pointerEvents="none"
      >
        <Text style={styles.backendLabel}>
          {BACKEND === 'coreml' ? 'Core ML' : 'XNNPACK'}
        </Text>
        <Text style={styles.fps}>{fps}</Text>
        <Text style={styles.fpsUnit}>FPS</Text>
        <Text style={styles.ms}>{frameMs} ms</Text>
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
  },
  message: { color: 'white', fontSize: 18 },
  readout: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  backendLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  fps: {
    color: 'white',
    fontSize: 120,
    fontWeight: '800',
    lineHeight: 130,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  fpsUnit: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    marginTop: -8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  ms: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 22,
    fontWeight: '600',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
