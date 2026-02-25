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
import {
  Detection,
  SSDLITE_320_MOBILENET_V3_LARGE,
  useObjectDetection,
} from 'react-native-executorch';
import { GeneratingContext } from '../../context';
import Spinner from '../../components/Spinner';
import ColorPalette from '../../colors';

export default function ObjectDetectionLiveScreen() {
  const insets = useSafeAreaInsets();
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });

  const model = useObjectDetection({ model: SSDLITE_320_MOBILENET_V3_LARGE });
  const { setGlobalGenerating } = useContext(GeneratingContext);

  useEffect(() => {
    setGlobalGenerating(model.isGenerating);
  }, [model.isGenerating, setGlobalGenerating]);

  const [detections, setDetections] = useState<Detection[]>([]);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [fps, setFps] = useState(0);
  const lastFrameTimeRef = useRef(Date.now());

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

  const updateDetections = useCallback(
    (payload: {
      results: Detection[];
      imageWidth: number;
      imageHeight: number;
    }) => {
      setDetections(payload.results);
      setImageSize({ width: payload.imageWidth, height: payload.imageHeight });
      const now = Date.now();
      const timeDiff = now - lastFrameTimeRef.current;
      if (timeDiff > 0) {
        setFps(Math.round(1000 / timeDiff));
      }
      lastFrameTimeRef.current = now;
    },
    []
  );

  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    onFrame(frame) {
      'worklet';
      if (!model.runOnFrame) {
        frame.dispose();
        return;
      }
      // After 90° CW rotation, the image fed to the model has swapped dims.
      const imageWidth =
        frame.width > frame.height ? frame.height : frame.width;
      const imageHeight =
        frame.width > frame.height ? frame.width : frame.height;
      try {
        const result = model.runOnFrame(frame, 0.5);
        if (result) {
          scheduleOnRN(updateDetections, {
            results: result,
            imageWidth,
            imageHeight,
          });
        }
      } catch {
        // ignore frame errors
      } finally {
        frame.dispose();
      }
    },
  });

  if (!model.isReady) {
    return (
      <Spinner
        visible={!model.isReady}
        textContent={`Loading the model ${(model.downloadProgress * 100).toFixed(0)} %`}
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

      {/* Bounding box overlay — measured to match the exact camera preview area */}
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
        {(() => {
          // Cover-fit: camera preview scales to fill the canvas, cropping the
          // excess. Compute the same transform so bbox pixel coords map correctly.
          const scale = Math.max(
            canvasSize.width / imageSize.width,
            canvasSize.height / imageSize.height
          );
          const offsetX = (canvasSize.width - imageSize.width * scale) / 2;
          const offsetY = (canvasSize.height - imageSize.height * scale) / 2;
          return detections.map((det, i) => {
            const left = det.bbox.x1 * scale + offsetX;
            const top = det.bbox.y1 * scale + offsetY;
            const width = (det.bbox.x2 - det.bbox.x1) * scale;
            const height = (det.bbox.y2 - det.bbox.y1) * scale;
            return (
              <View key={i} style={[styles.bbox, { left, top, width, height }]}>
                <View style={styles.bboxLabel}>
                  <Text style={styles.bboxLabelText}>
                    {det.label} {(det.score * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>
            );
          });
        })()}
      </View>

      <View
        style={[styles.bottomBarWrapper, { paddingBottom: insets.bottom + 12 }]}
        pointerEvents="none"
      >
        <View style={styles.bottomBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{detections.length}</Text>
            <Text style={styles.statLabel}>objects</Text>
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
  bbox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: ColorPalette.primary,
    borderRadius: 4,
  },
  bboxLabel: {
    position: 'absolute',
    top: -22,
    left: -2,
    backgroundColor: ColorPalette.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bboxLabelText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
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
