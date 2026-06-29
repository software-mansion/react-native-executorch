import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles, theme } from '../../theme';
import {
  Skia,
  ColorType,
  AlphaType,
  useImage,
  type SkImage as SkiaImageType,
} from '@shopify/react-native-skia';
import {
  useInstanceSegmenter,
  models,
  type InstanceSegmentationResult,
} from 'react-native-executorch';
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
    label: 'YOLO26 Nano (XNNPACK FP32)',
    value: models.instanceSegmentation.YOLO26.NANO.SIZE_384.XNNPACK_FP32,
  },
  {
    label: 'RFDETR (XNNPACK FP32)',
    value: models.instanceSegmentation.RFDETR_NANO.XNNPACK_FP32,
  },
  {
    label: 'RFDETR (CoreML INT8)',
    value: models.instanceSegmentation.RFDETR_NANO.COREML_INT8,
    disabled: Platform.OS !== 'ios',
  },
  {
    label: 'FastSAM Small (XNNPACK FP32)',
    value: models.instanceSegmentation.FASTSAM.S.XNNPACK_FP32,
  },
  {
    label: 'FastSAM X-Large (XNNPACK FP32)',
    value: models.instanceSegmentation.FASTSAM.X.XNNPACK_FP32,
  },
  {
    label: 'FastSAM Small (CoreML FP16)',
    value: models.instanceSegmentation.FASTSAM.S.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
  {
    label: 'FastSAM X-Large (CoreML FP16)',
    value: models.instanceSegmentation.FASTSAM.X.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
];

const MASK_COLORS = [
  { r: 255, g: 99, b: 132, a: 140 }, // Pink/Red
  { r: 54, g: 162, b: 235, a: 140 }, // Blue
  { r: 255, g: 206, b: 86, a: 140 }, // Yellow
  { r: 75, g: 192, b: 192, a: 140 }, // Teal
  { r: 153, g: 102, b: 255, a: 140 }, // Purple
  { r: 255, g: 159, b: 64, a: 140 }, // Orange
  { r: 46, g: 204, b: 113, a: 140 }, // Green
  { r: 231, g: 76, b: 60, a: 140 }, // Crimson
];

const MASK_STROKE_COLORS = [
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F64',
  '#2ECC71',
  '#E74C3C',
];

const VIEW_WIDTH = Dimensions.get('window').width - 32;
const VIEW_HEIGHT = Math.round((VIEW_WIDTH * 16) / 9);

function InstanceSegmentationContent() {
  const insets = useSafeAreaInsets();
  const [selectedModel, setSelectedModel] = useState<any>(MODEL_OPTIONS[0].value);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<InstanceSegmentationResult<'xyxy', string>[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [masks, setMasks] = useState<{ image: SkiaImageType; color: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isProcessingRef = useRef(false);

  const skiaImage = useImage(imageUri, (err) => setError(err.message || String(err)));

  const {
    isReady,
    downloadProgress,
    error: loadError,
    segmentInstances,
    segmentInstancesWorklet,
  } = useInstanceSegmenter(selectedModel);

  const handlePickImage = async (useCamera: boolean) => {
    setError(null);
    try {
      const uri = await getImage(useCamera);
      if (uri) {
        setImageUri(uri);
        setResults([]);
        setLatency(null);
        setMasks([]);
      }
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const runSegmentation = async (sync: boolean) => {
    if (isProcessingRef.current) return;
    if (!skiaImage || !segmentInstances || !segmentInstancesWorklet) return;

    isProcessingRef.current = true;
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
        sync ? segmentInstancesWorklet(buffer) : await segmentInstances(buffer)
      ) as InstanceSegmentationResult<'xyxy', string>[];
      setLatency(Date.now() - start);
      setResults(output);

      const nextMasks: { image: SkiaImageType; color: string }[] = [];
      for (let i = 0; i < output.length; i++) {
        const inst = output[i]!;
        const color = MASK_COLORS[i % MASK_COLORS.length]!;
        const colorStr = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;

        const maskData = inst.mask.data;
        const maskW = inst.mask.width;
        const maskH = inst.mask.height;
        const outData = Skia.Data.fromBytes(maskData);
        const info = {
          width: maskW,
          height: maskH,
          colorType: ColorType.Alpha_8,
          alphaType: AlphaType.Premul,
        };
        const maskImage = Skia.Image.MakeImage(info, outData, maskW);
        if (maskImage) {
          nextMasks.push({ image: maskImage, color: colorStr });
        }
      }
      setMasks(nextMasks);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      isProcessingRef.current = false;
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
        Upload or capture an image to run instance segmentation.
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
          setMasks([]);
        }}
      />

      <ModelStatus
        isReady={isReady}
        downloadProgress={downloadProgress}
        error={activeError}
        modelTypeLabel="segmenter model"
      />

      <ImageViewport
        skiaImage={skiaImage}
        masks={masks}
        onPressPlaceholder={() => handlePickImage(false)}
      >
        {skiaImage && results.length > 0 && (
          <View style={styles.overlayContainer} pointerEvents="none">
            {results.map((det, index: number) => {
              const strokeColor = MASK_STROKE_COLORS[index % MASK_STROKE_COLORS.length]!;

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
                  backgroundColor="transparent"
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
          onPress={() => runSegmentation(false)}
          disabled={!skiaImage || !isReady || isProcessing}
          loading={isProcessing}
        />
        <Button
          title="Run Sync"
          onPress={() => runSegmentation(true)}
          disabled={!skiaImage || !isReady || isProcessing}
          variant="accent"
        />
      </View>

      <LatencyIndicator latency={latency} />
    </ScrollView>
  );
}

export default function InstanceSegmentationScreen() {
  return (
    <ScreenWrapper>
      <InstanceSegmentationContent />
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
