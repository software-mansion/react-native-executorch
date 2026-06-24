import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles, theme } from '../../theme';
import { useImage } from '@shopify/react-native-skia';
import { useKeypointDetector, models, type KeypointDetection } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getImage } from '../../utils';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';
import { ImageViewport } from '../../components/ImageViewport';
import { ModelStatus } from '../../components/ModelStatus';
import { LatencyIndicator } from '../../components/LatencyIndicator';
import { Button } from '../../components/Button';
import { BoundingBox } from '../../components/BoundingBox';

const MODEL_OPTIONS: ModelOption[] = [
  {
    label: 'BlazeFace (XNNPACK FP32)',
    value: models.keypointDetection.BLAZEFACE,
  },
  {
    label: 'YOLOv8n Pose (XNNPACK FP32)',
    value: models.keypointDetection.YOLOV8N_POSE.SIZE_384.XNNPACK_FP32,
  },
  {
    label: 'YOLO26 Pose (XNNPACK FP32)',
    value: models.keypointDetection.YOLO26_POSE.SIZE_384.XNNPACK_FP32,
  },
  {
    label: 'RF-DETR Keypoint (XNNPACK FP32)',
    value: models.keypointDetection.RFDETR_KEYPOINT.XNNPACK_FP32,
  },
  {
    label: 'RF-DETR Keypoint (CoreML FP32)',
    value: models.keypointDetection.RFDETR_KEYPOINT.COREML_FP32,
    disabled: Platform.OS !== 'ios',
  },
  {
    label: 'RF-DETR Keypoint (MLX FP32)',
    value: models.keypointDetection.RFDETR_KEYPOINT.MLX_FP32,
    disabled: Platform.OS !== 'ios',
  },
];

const VIEW_WIDTH = Dimensions.get('window').width - 32;
const VIEW_HEIGHT = Math.round((VIEW_WIDTH * 16) / 9);

function KeypointContent() {
  const insets = useSafeAreaInsets();
  const [selectedModel, setSelectedModel] = useState<any>(MODEL_OPTIONS[0].value);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<KeypointDetection<'xyxy', string>[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const skiaImage = useImage(imageUri, (err) => setError(err.message || String(err)));

  const {
    isReady,
    downloadProgress,
    error: loadError,
    detectKeypoints,
    detectKeypointsWorklet,
  } = useKeypointDetector(selectedModel);

  const handlePickImage = async (useCamera: boolean) => {
    setError(null);
    try {
      const uri = await getImage(useCamera);
      if (uri) {
        setImageUri(uri);
        setResults([]);
        setLatency(null);
      }
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const runDetection = async (sync: boolean) => {
    if (!skiaImage || !detectKeypoints || !detectKeypointsWorklet) return;
    if (!sync) setIsProcessing(true);
    setError(null);
    try {
      const pixels = skiaImage.readPixels();
      if (!pixels) {
        throw new Error('Failed to read pixels from image');
      }
      if (!(pixels instanceof Uint8Array)) {
        throw new Error('Expected Uint8Array from readPixels');
      }
      const buffer = {
        data: pixels,
        width: skiaImage.width(),
        height: skiaImage.height(),
        format: 'rgba' as const,
        layout: 'hwc' as const,
      };
      const start = Date.now();
      const output = (
        sync ? detectKeypointsWorklet(buffer) : await detectKeypoints(buffer)
      ) as KeypointDetection<'xyxy', string>[];

      setLatency(Date.now() - start);
      setResults(output);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      if (!sync) setIsProcessing(false);
    }
  };

  let scaleX = 1;
  let scaleY = 1;
  let offsetX = 0;
  let offsetY = 0;

  if (skiaImage) {
    const imgW = skiaImage.width();
    const imgH = skiaImage.height();
    const scale = Math.min(VIEW_WIDTH / imgW, VIEW_HEIGHT / imgH);
    const displayedW = imgW * scale;
    const displayedH = imgH * scale;
    offsetX = (VIEW_WIDTH - displayedW) / 2;
    offsetY = (VIEW_HEIGHT - displayedH) / 2;
    scaleX = scale;
    scaleY = scale;
  }

  const activeError = loadError ? String(loadError) : error;

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={[
        commonStyles.contentContainer,
        { paddingBottom: insets.bottom + theme.spacing.large },
      ]}
    >
      <Text style={commonStyles.description}>
        Upload or capture an image to run keypoint/pose estimation on it.
      </Text>

      <ModelPicker
        label="Model"
        options={MODEL_OPTIONS}
        selectedValue={selectedModel}
        onValueChange={(model) => {
          setSelectedModel(model);
          setResults([]);
          setLatency(null);
          setError(null);
        }}
      />

      <ModelStatus
        isReady={isReady}
        downloadProgress={downloadProgress}
        error={activeError}
        modelTypeLabel="keypoint model"
      />

      <ImageViewport skiaImage={skiaImage} onPressPlaceholder={() => handlePickImage(false)}>
        {skiaImage && results.length > 0 && (
          <View style={styles.overlayContainer} pointerEvents="none">
            {results.map((det, index: number) => {
              const strokeColor = '#00ff00';
              const bgColor = 'rgba(0, 255, 0, 0.15)';
              const landmarkColor = '#ff00ff';

              const left = offsetX + det.box.xmin * scaleX;
              const top = offsetY + det.box.ymin * scaleY;
              const width = (det.box.xmax - det.box.xmin) * scaleX;
              const height = (det.box.ymax - det.box.ymin) * scaleY;

              return (
                <React.Fragment key={index}>
                  {/* Bounding Box */}
                  <BoundingBox
                    left={left}
                    top={top}
                    width={width}
                    height={height}
                    borderColor={strokeColor}
                    backgroundColor={bgColor}
                    label={`Det ${Math.round(det.confidence * 100)}%`}
                  />

                  {/* Landmarks */}
                  {Object.entries(det.landmarks).map(([key, point]) => {
                    const x = offsetX + point.x * scaleX;
                    const y = offsetY + point.y * scaleY;
                    return (
                      <View
                        key={key}
                        style={[
                          styles.landmarkContainer,
                          {
                            left: x - 50,
                            top: y - 4,
                          },
                        ]}
                      >
                        <View style={[styles.landmarkDot, { backgroundColor: landmarkColor }]} />
                        <Text style={[styles.landmarkText, { color: landmarkColor }]}>
                          {key}: {Math.round(point.confidence * 100)}%
                        </Text>
                      </View>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </View>
        )}
      </ImageViewport>

      <View style={commonStyles.buttonRow}>
        <Button title="Gallery" onPress={() => handlePickImage(false)} variant="secondary" />
        <Button title="Camera" onPress={() => handlePickImage(true)} variant="secondary" />
      </View>

      <View style={commonStyles.buttonRow}>
        <Button
          title="Run Async"
          onPress={() => runDetection(false)}
          disabled={!skiaImage || !isReady || isProcessing}
          loading={isProcessing}
        />
        <Button
          title="Run Sync"
          onPress={() => runDetection(true)}
          disabled={!skiaImage || !isReady || isProcessing}
          variant="accent"
        />
      </View>

      <LatencyIndicator latency={latency} />
    </ScrollView>
  );
}

export default function KeypointScreen() {
  return (
    <ScreenWrapper>
      <KeypointContent />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  landmarkContainer: {
    position: 'absolute',
    width: 100,
    alignItems: 'center',
  },
  landmarkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff00ff',
    borderWidth: 1,
    borderColor: '#fff',
  },
  landmarkText: {
    color: '#ff00ff',
    fontSize: 8,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    textAlign: 'center',
  },
});
