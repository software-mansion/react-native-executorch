import React, { useState, useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles, theme } from '../../theme';
import {
  Skia,
  ColorType,
  AlphaType,
  useImage,
  type SkImage as SkiaImageType,
} from '@shopify/react-native-skia';
import { useSemanticSegmenter, models } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';
import { getImage } from '../../utils';
import { ImageViewport } from '../../components/ImageViewport';
import { ModelStatus } from '../../components/ModelStatus';
import { LatencyIndicator } from '../../components/LatencyIndicator';
import { Button } from '../../components/Button';

const SEGMENTATION_OPTIONS: ModelOption[] = [
  {
    label: 'Selfie Seg (FP32)',
    value: models.semanticSegmentation.SELFIE_SEGMENTATION.XNNPACK_FP32,
  },
  {
    label: 'LRASPP MobileNet V3 (INT8)',
    value: models.semanticSegmentation.LRASPP_MOBILENET_V3_LARGE.XNNPACK_INT8,
  },
  {
    label: 'DeepLab V3 ResNet50 (INT8)',
    value: models.semanticSegmentation.DEEPLAB_V3_RESNET50.XNNPACK_INT8,
  },
  {
    label: 'DeepLab V3 ResNet101 (INT8)',
    value: models.semanticSegmentation.DEEPLAB_V3_RESNET101.XNNPACK_INT8,
  },
  {
    label: 'DeepLab V3 MobileNet V3 (INT8)',
    value: models.semanticSegmentation.DEEPLAB_V3_MOBILENET_V3_LARGE.XNNPACK_INT8,
  },
  {
    label: 'FCN ResNet50 (INT8)',
    value: models.semanticSegmentation.FCN_RESNET50.XNNPACK_INT8,
  },
  {
    label: 'FCN ResNet101 (INT8)',
    value: models.semanticSegmentation.FCN_RESNET101.XNNPACK_INT8,
  },
];

function SegmentationContent() {
  const insets = useSafeAreaInsets();
  const [selectedModel, setSelectedModel] = useState<any>(SEGMENTATION_OPTIONS[0].value);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [segmentationImage, setSegmentationImage] = useState<SkiaImageType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isProcessingRef = useRef(false);

  const skiaImage = useImage(imageUri, (err) => setError(err.message || String(err)));

  const {
    isReady,
    downloadProgress,
    error: loadError,
    segment,
    segmentWorklet,
  } = useSemanticSegmenter(selectedModel);

  const handlePickImage = async (useCamera: boolean) => {
    setError(null);
    try {
      const uri = await getImage(useCamera);
      if (uri) {
        setImageUri(uri);
        setLatency(null);
        setSegmentationImage(null);
      }
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const runSegmentation = async (sync: boolean) => {
    if (isProcessingRef.current) return;
    if (!skiaImage || !segment || !segmentWorklet) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
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
      const { buffer: outBuffer } = sync ? segmentWorklet(buffer) : await segment(buffer);
      setLatency(Date.now() - start);

      const outData = Skia.Data.fromBytes(outBuffer.data);
      const info = {
        width: buffer.width,
        height: buffer.height,
        colorType: ColorType.RGBA_8888,
        alphaType: AlphaType.Premul,
      };
      const nextImage = Skia.Image.MakeImage(info, outData, buffer.width * 4);
      if (!nextImage) {
        throw new Error('Failed to create overlay image from output data');
      }
      setSegmentationImage(nextImage);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

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
        Upload or capture an image to partition it into multiple segments using semantic
        segmentation.
      </Text>

      <ModelPicker
        label="Model"
        options={SEGMENTATION_OPTIONS}
        selectedValue={selectedModel}
        onValueChange={(model) => {
          setSelectedModel(model);
          setLatency(null);
          setError(null);
          setSegmentationImage(null);
        }}
      />

      <ModelStatus
        isReady={isReady}
        downloadProgress={downloadProgress}
        error={activeError}
        modelTypeLabel="segmentation model"
      />

      <ImageViewport
        skiaImage={skiaImage}
        overlayImage={segmentationImage}
        onPressPlaceholder={() => handlePickImage(false)}
      />

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

export default function SegmentationScreen() {
  return (
    <ScreenWrapper>
      <SegmentationContent />
    </ScreenWrapper>
  );
}
