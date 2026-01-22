import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  useCameraFormat,
} from 'react-native-vision-camera';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import {
  ObjectDetectionModule,
  SSDLITE_320_MOBILENET_V3_LARGE,
} from 'react-native-executorch';
import type { Detection } from 'react-native-executorch';
import ScreenWrapper from '../../ScreenWrapper';
import ColorPalette from '../../colors';
import { useRunOnJS } from 'react-native-worklets-core';
import {
  Canvas,
  Rect,
  Text as SkiaText,
  matchFont,
} from '@shopify/react-native-skia';

// Color palette for different object classes
const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
  '#F8B739',
  '#52B788',
];

const getColorForLabel = (label: string): string => {
  const hash = label
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
};

export default function CameraObjectDetectionScreen() {
  // Model loading state
  const detectionModel = useMemo(() => new ObjectDetectionModule(), []);
  const [isModelReady, setIsModelReady] = useState(false);

  // Resize plugin instance
  const { resize } = useResizePlugin();

  // Screen dimensions
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Detection results
  const [detections, setDetections] = useState<Detection[]>([]);
  const [fps, setFps] = useState(0);
  const lastFrameTimeRef = useRef(Date.now());
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });

  const processDetectionCallback = useRunOnJS((results: Detection[]) => {
    setDetections(results);
    const now = Date.now();
    const timeDiff = now - lastFrameTimeRef.current;
    if (timeDiff > 0) {
      setFps(Math.round(1000 / timeDiff));
    }
    lastFrameTimeRef.current = now;
  }, []);

  // Camera permissions
  const device = useCameraDevice('back');
  const format = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
    { videoStabilizationMode: 'off' },
  ]);
  const { hasPermission, requestPermission } = useCameraPermission();
  const internalModel = isModelReady ? detectionModel.nativeModule : null;

  // Load the model
  useEffect(() => {
    (async () => {
      try {
        await detectionModel.load(SSDLITE_320_MOBILENET_V3_LARGE);
        setIsModelReady(true);
      } catch (error) {
        console.error('Failed to load model:', error);
      }
    })();

    return () => {
      detectionModel.delete();
    };
  }, [detectionModel]);

  // Frame processor throttled to 10fps via frameProcessorFps prop
  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';

      try {
        if (internalModel == null) {
          return;
        }

        // Resize frame to model input size (640x640 for YOLO)
        const resizedArray = resize(frame, {
          scale: {
            width: 640,
            height: 640,
          },
          pixelFormat: 'rgb',
          dataType: 'uint8',
          rotation: '90deg',
        });

        // Create object with buffer and dimensions
        const resizedData = {
          data: resizedArray.buffer,
          width: 640,
          height: 640,
        };

        // Pass raw pixel data to model with detection threshold
        const result = internalModel.generateFromFrame(resizedData, 0.5);

        // Pass results and timestamp to JS
        processDetectionCallback(result);
      } catch (error: any) {
        console.log(
          'Frame processing error:',
          error?.message || 'Unknown error'
        );
      }
    },
    [internalModel, resize, processDetectionCallback]
  );

  // Loading state
  if (!isModelReady) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ColorPalette.strongPrimary} />
          <Text style={styles.loadingText}>Loading model...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Request permissions
  if (!hasPermission) {
    return (
      <ScreenWrapper>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera permission is required
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  // No camera device
  if (!device) {
    return (
      <ScreenWrapper>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No camera device found</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Camera View */}
        <Camera
          format={format}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          fps={30}
          frameProcessor={frameProcessor}
          pixelFormat="yuv"
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setCameraLayout({ width, height });
          }}
        />

        {/* Bounding Box Overlay with Skia */}
        <BoundingBoxOverlay
          detections={detections}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          cameraLayout={cameraLayout}
        />

        {/* Stats Overlay */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>FPS</Text>
            <Text style={styles.statValue}>{fps}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Objects</Text>
            <Text style={styles.statValue}>{detections.length}</Text>
          </View>
        </View>

        {/* Detection Info */}
        {detections.length > 0 && (
          <View style={styles.detectionList}>
            {detections.slice(0, 5).map((detection, index) => (
              <View
                key={index}
                style={[
                  styles.detectionItem,
                  { borderLeftColor: getColorForLabel(detection.label) },
                ]}
              >
                <Text style={styles.detectionLabel}>
                  {detection.label.toLowerCase().replace(/_/g, ' ')}
                </Text>
                <Text style={styles.detectionScore}>
                  {(detection.score * 100).toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

// Bounding Box Overlay Component using Skia for smooth rendering
function BoundingBoxOverlay({
  detections,
  screenWidth,
  screenHeight,
  cameraLayout,
}: {
  detections: Detection[];
  screenWidth: number;
  screenHeight: number;
  cameraLayout: { width: number; height: number };
}) {
  const font = matchFont({
    fontSize: 14,
    fontWeight: 'bold',
  });

  // Frame size is 640x640 because that's what we're passing to C++ as originalSize
  // The C++ postprocess scales bboxes relative to this size
  const frameSize = { width: 640, height: 640 };

  // Use actual camera layout if available, otherwise fallback to screen dimensions
  const cameraWidth = cameraLayout.width || screenWidth;
  const cameraHeight = cameraLayout.height || screenHeight;

  // Calculate how the camera frame fits on screen (matching your working example)
  const frameAspectRatio = frameSize.width / frameSize.height;
  const cameraAspectRatio = cameraWidth / cameraHeight;

  let previewWidth, previewHeight, offsetX, offsetY;

  if (cameraAspectRatio > frameAspectRatio) {
    // Screen is wider - pillarboxed
    previewHeight = cameraHeight;
    previewWidth = cameraHeight * frameAspectRatio;
    offsetX = (cameraWidth - previewWidth) / 2;
    offsetY = 0;
  } else {
    // Screen is taller - letterboxed
    previewWidth = cameraWidth;
    previewHeight = cameraWidth / frameAspectRatio;
    offsetX = 0;
    offsetY = (cameraHeight - previewHeight) / 2;
  }

  const scaleX = previewWidth / frameSize.width;
  const scaleY = previewHeight / frameSize.height;

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {detections.map((detection, index) => {
        const { bbox, label, score } = detection;
        const color = getColorForLabel(label);

        // Direct transformation - rotation is handled by resize plugin
        const x = bbox.x1 * scaleX + offsetX;
        const y = bbox.y1 * scaleY + offsetY;
        const width = (bbox.x2 - bbox.x1) * scaleX;
        const height = (bbox.y2 - bbox.y1) * scaleY;

        // Label dimensions
        const labelText = `${label.toLowerCase().replace(/_/g, ' ')} ${(score * 100).toFixed(0)}%`;
        const labelWidth = Math.max(width, 120);
        const labelHeight = 24;

        return (
          <React.Fragment key={index}>
            {/* Bounding box border */}
            <Rect
              x={x}
              y={y}
              width={width}
              height={height}
              color={color}
              style="stroke"
              strokeWidth={3}
            />

            {/* Label background */}
            <Rect
              x={x}
              y={Math.max(y - labelHeight, 0)}
              width={labelWidth}
              height={labelHeight}
              color={color}
              opacity={0.9}
            />

            {/* Label text */}
            <SkiaText
              x={x + 6}
              y={Math.max(y - 6, 18)}
              text={labelText}
              font={font}
              color="white"
            />
          </React.Fragment>
        );
      })}
    </Canvas>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  statLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  detectionList: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    gap: 8,
  },
  detectionItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  detectionLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  detectionScore: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: ColorPalette.strongPrimary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    color: ColorPalette.strongPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: ColorPalette.strongPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
