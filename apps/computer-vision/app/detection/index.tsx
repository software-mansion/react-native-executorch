import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles, theme } from '../../theme';
import { useImage } from '@shopify/react-native-skia';
import { useObjectDetector, models, type ObjectDetection } from 'react-native-executorch';
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
    label: 'SSDLite 320 MobileNet V3 Large (XNNPACK FP32)',
    value: models.objectDetection.SSDLITE320_MOBILENET_V3_LARGE,
  },
  {
    label: 'RF-DETR Nano (XNNPACK FP32)',
    value: models.objectDetection.RFDETR_NANO,
  },
  {
    label: 'RF-DETR Nano (CoreML INT8)',
    value: models.objectDetection.RFDETR_NANO.COREML_INT8,
    disabled: Platform.OS !== 'ios',
  },
  {
    label: 'YOLO26 Nano 384 (XNNPACK FP32)',
    value: models.objectDetection.YOLO26.NANO.SIZE_384.XNNPACK_FP32,
  },
  {
    label: 'YOLO26 Nano 640 (XNNPACK FP32)',
    value: models.objectDetection.YOLO26.NANO.SIZE_640.XNNPACK_FP32,
  },
  {
    label: 'YOLO26 Small 640 (XNNPACK FP32)',
    value: models.objectDetection.YOLO26.SMALL.SIZE_640.XNNPACK_FP32,
  },
  {
    label: 'YOLO26 Medium 640 (XNNPACK FP32)',
    value: models.objectDetection.YOLO26.MEDIUM.SIZE_640.XNNPACK_FP32,
  },
  {
    label: 'YOLO26 Large 640 (XNNPACK FP32)',
    value: models.objectDetection.YOLO26.LARGE.SIZE_640.XNNPACK_FP32,
  },
  {
    label: 'YOLO26 X-Large 640 (XNNPACK FP32)',
    value: models.objectDetection.YOLO26.XLARGE.SIZE_640.XNNPACK_FP32,
  },
];

const VIEW_WIDTH = Dimensions.get('window').width - 32;
const VIEW_HEIGHT = Math.round((VIEW_WIDTH * 16) / 9);

function DetectionContent() {
  const insets = useSafeAreaInsets();
  const [selectedModel, setSelectedModel] = useState<any>(MODEL_OPTIONS[0].value);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ObjectDetection<'xyxy', string>[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const skiaImage = useImage(imageUri, (err) => setError(err.message || String(err)));

  const {
    isReady,
    downloadProgress,
    error: loadError,
    detectObjects,
    detectObjectsWorklet,
  } = useObjectDetector(selectedModel);

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
    if (!skiaImage || !detectObjects || !detectObjectsWorklet) return;
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
        sync ? detectObjectsWorklet(buffer) : await detectObjects(buffer)
      ) as ObjectDetection<'xyxy', string>[];

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
        Upload or capture an image to run object detection.
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
        modelTypeLabel="detector model"
      />

      <ImageViewport skiaImage={skiaImage} onPressPlaceholder={() => handlePickImage(false)}>
        {skiaImage && results.length > 0 && (
          <View style={styles.overlayContainer} pointerEvents="none">
            {results.map((det, index: number) => {
              const strokeColor = '#00ff00';
              const bgColor = 'rgba(0, 255, 0, 0.15)';

              const left = offsetX + det.box.xmin * scaleX;
              const top = offsetY + det.box.ymin * scaleY;
              const width = (det.box.xmax - det.box.xmin) * scaleX;
              const height = (det.box.ymax - det.box.ymin) * scaleY;

              return (
                <BoundingBox
                  key={index}
                  left={left}
                  top={top}
                  width={width}
                  height={height}
                  borderColor={strokeColor}
                  backgroundColor={bgColor}
                  label={`${det.label} ${Math.round(det.confidence * 100)}%`}
                  labelTextColor="#fff"
                />
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

export default function DetectionScreen() {
  return (
    <ScreenWrapper>
      <DetectionContent />
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
});
