import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Camera,
  getCameraFormat,
  Templates,
  useCameraDevices,
  useCameraPermission,
  useFrameOutput,
} from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import { OCR_ENGLISH, useOCR, OCRDetection } from 'react-native-executorch';
import {
  Canvas,
  Path,
  Skia,
  Text as SkiaText,
  matchFont,
} from '@shopify/react-native-skia';
import { GeneratingContext } from '../../context';
import Spinner from '../../components/Spinner';
import ColorPalette from '../../colors';

interface FrameDetections {
  detections: OCRDetection[];
  frameWidth: number;
  frameHeight: number;
}

export default function OCRLiveScreen() {
  const insets = useSafeAreaInsets();
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });

  const { isReady, isGenerating, downloadProgress, runOnFrame } = useOCR({
    model: OCR_ENGLISH,
  });
  const { setGlobalGenerating } = useContext(GeneratingContext);

  useEffect(() => {
    setGlobalGenerating(isGenerating);
  }, [isGenerating, setGlobalGenerating]);

  const [frameDetections, setFrameDetections] = useState<FrameDetections>({
    detections: [],
    frameWidth: 1,
    frameHeight: 1,
  });
  const [fps, setFps] = useState(0);
  const lastFrameTimeRef = useRef(Date.now());

  const font = matchFont({ fontFamily: 'Helvetica', fontSize: 11 });

  const cameraPermission = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back') ?? devices[0];

  const format = useMemo(() => {
    if (device == null) return undefined;
    try {
      return getCameraFormat(device, Templates.FrameProcessing);
    } catch {
      return undefined;
    }
  }, [device]);

  const updateDetections = useCallback((result: FrameDetections) => {
    setFrameDetections(result);
    const now = Date.now();
    const timeDiff = now - lastFrameTimeRef.current;
    if (timeDiff > 0) {
      setFps(Math.round(1000 / timeDiff));
    }
    lastFrameTimeRef.current = now;
  }, []);

  const frameOutput = useFrameOutput({
    dropFramesWhileBusy: true,
    pixelFormat: 'rgb',
    onFrame(frame) {
      'worklet';
      if (!runOnFrame) {
        frame.dispose();
        return;
      }
      const frameWidth = frame.width;
      const frameHeight = frame.height;
      try {
        const result = runOnFrame(frame);
        if (result) {
          scheduleOnRN(updateDetections, {
            detections: result,
            frameWidth,
            frameHeight,
          });
        }
      } catch {
        // ignore frame errors
      } finally {
        frame.dispose();
      }
    },
  });

  if (!isReady) {
    return (
      <Spinner
        visible={!isReady}
        textContent={`Loading the model ${(downloadProgress * 100).toFixed(0)} %`}
      />
    );
  }

  if (!cameraPermission.hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Camera access needed</Text>
        <TouchableOpacity
          onPress={() => cameraPermission.requestPermission()}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
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

  const { detections, frameWidth, frameHeight } = frameDetections;

  // OCR runs on the raw landscape frame (no rotation applied in native).
  // The camera preview displays it as portrait (90° CW rotation applied by iOS).
  // After rotation the image dimensions become (frameHeight × frameWidth).
  // Cover-fit scale uses post-rotation dims to match what the preview shows.
  const isLandscape = frameWidth > frameHeight;
  const imageW = isLandscape ? frameHeight : frameWidth;
  const imageH = isLandscape ? frameWidth : frameHeight;
  const scale = Math.max(canvasSize.width / imageW, canvasSize.height / imageH);
  const offsetX = (canvasSize.width - imageW * scale) / 2;
  const offsetY = (canvasSize.height - imageH * scale) / 2;

  // Map a raw landscape point to screen coords accounting for rotation + cover-fit.
  function toScreenX(px: number, py: number) {
    // After 90° CW: rotated_x = frameHeight - py, rotated_y = px
    const rx = isLandscape ? frameHeight - py : px;
    return rx * scale + offsetX;
  }
  function toScreenY(px: number, py: number) {
    const ry = isLandscape ? px : py;
    return ry * scale + offsetY;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        outputs={[frameOutput]}
        isActive={true}
        format={format}
      />

      {/* Measure the overlay area, then draw polygons inside a Canvas */}
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        onLayout={(e) =>
          setCanvasSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        <Canvas style={StyleSheet.absoluteFill}>
          {detections.map((det, i) => {
            if (!det.bbox || det.bbox.length < 2) return null;

            const path = Skia.Path.Make();
            path.moveTo(
              toScreenX(det.bbox[0]!.x, det.bbox[0]!.y),
              toScreenY(det.bbox[0]!.x, det.bbox[0]!.y)
            );
            for (let j = 1; j < det.bbox.length; j++) {
              path.lineTo(
                toScreenX(det.bbox[j]!.x, det.bbox[j]!.y),
                toScreenY(det.bbox[j]!.x, det.bbox[j]!.y)
              );
            }
            path.close();

            const labelX = toScreenX(det.bbox[0]!.x, det.bbox[0]!.y);
            const labelY = Math.max(
              0,
              toScreenY(det.bbox[0]!.x, det.bbox[0]!.y) - 4
            );

            return (
              <React.Fragment key={i}>
                <Path path={path} color="transparent" style="fill" />
                <Path
                  path={path}
                  color={ColorPalette.primary}
                  style="stroke"
                  strokeWidth={2}
                />
                {font && (
                  <SkiaText
                    x={labelX}
                    y={labelY}
                    text={`${det.text} ${(det.score * 100).toFixed(0)}%`}
                    font={font}
                    color={ColorPalette.primary}
                  />
                )}
              </React.Fragment>
            );
          })}
        </Canvas>
      </View>

      <View
        style={[styles.bottomBarWrapper, { paddingBottom: insets.bottom + 12 }]}
        pointerEvents="none"
      >
        <View style={styles.bottomBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{detections.length}</Text>
            <Text style={styles.statLabel}>regions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{fps}</Text>
            <Text style={styles.statLabel}>fps</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centered: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  message: {
    color: 'white',
    fontSize: 18,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: ColorPalette.primary,
    borderRadius: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  bottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 10,
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
