import React, { useState } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { commonStyles } from '../../theme';
import {
  useImage,
  Skia,
  ColorType,
  AlphaType,
  type SkImage as SkiaImageType,
} from '@shopify/react-native-skia';
import { useStyleTransfer, models } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getImage } from '../../utils';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';
import { ImageViewport } from '../../components/ImageViewport';
import { ModelStatus } from '../../components/ModelStatus';
import { LatencyIndicator } from '../../components/LatencyIndicator';
import { Button } from '../../components/Button';

const MODEL_OPTIONS: ModelOption[] = [
  {
    label: 'Candy (XNNPACK INT8)',
    value: models.styleTransfer.CANDY.XNNPACK_INT8,
  },
  {
    label: 'Candy (CoreML FP16)',
    value: models.styleTransfer.CANDY.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
  {
    label: 'Mosaic (XNNPACK INT8)',
    value: models.styleTransfer.MOSAIC.XNNPACK_INT8,
  },
  {
    label: 'Mosaic (CoreML FP16)',
    value: models.styleTransfer.MOSAIC.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
  {
    label: 'Rain Princess (XNNPACK INT8)',
    value: models.styleTransfer.RAIN_PRINCESS.XNNPACK_INT8,
  },
  {
    label: 'Rain Princess (CoreML FP16)',
    value: models.styleTransfer.RAIN_PRINCESS.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
  {
    label: 'Udnie (XNNPACK INT8)',
    value: models.styleTransfer.UDNIE.XNNPACK_INT8,
  },
  {
    label: 'Udnie (CoreML FP16)',
    value: models.styleTransfer.UDNIE.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
];

function StyleTransferContent() {
  const [selectedModel, setSelectedModel] = useState<any>(MODEL_OPTIONS[0].value);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [styledImage, setStyledImage] = useState<SkiaImageType | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const skiaImage = useImage(imageUri, (err) => setError(err.message || String(err)));

  const {
    isReady,
    downloadProgress,
    error: loadError,
    transferStyle,
    transferStyleWorklet,
  } = useStyleTransfer(selectedModel);

  const handlePickImage = async (useCamera: boolean) => {
    setError(null);
    try {
      const uri = await getImage(useCamera);
      if (uri) {
        setImageUri(uri);
        setStyledImage(null);
        setShowOriginal(false);
        setLatency(null);
      }
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const runStyleTransfer = async (sync: boolean) => {
    if (!skiaImage || !transferStyle || !transferStyleWorklet) return;
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
      const output = sync ? transferStyleWorklet(buffer) : await transferStyle(buffer);

      setLatency(Date.now() - start);

      const outData = Skia.Data.fromBytes(output.data);
      const info = {
        width: skiaImage.width(),
        height: skiaImage.height(),
        colorType: ColorType.RGBA_8888,
        alphaType: AlphaType.Premul,
      };
      const skiaStyled = Skia.Image.MakeImage(info, outData, skiaImage.width() * 4);
      if (skiaStyled) {
        setStyledImage(skiaStyled);
        setShowOriginal(false);
      } else {
        throw new Error('Failed to decode styled image in Skia');
      }
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      if (!sync) setIsProcessing(false);
    }
  };

  const activeError = loadError ? String(loadError) : error;
  const activeImage = showOriginal ? skiaImage : (styledImage ?? skiaImage);

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={commonStyles.contentContainer}
    >
      <Text style={commonStyles.description}>
        Upload or capture an image to apply artistic style transfer filters.
      </Text>

      <ModelPicker
        label="Style Model"
        options={MODEL_OPTIONS}
        selectedValue={selectedModel}
        onValueChange={(model) => {
          setSelectedModel(model);
          setStyledImage(null);
          setShowOriginal(false);
          setLatency(null);
          setError(null);
        }}
      />

      <ModelStatus
        isReady={isReady}
        downloadProgress={downloadProgress}
        error={activeError}
        modelTypeLabel="style transfer model"
      />

      <ImageViewport skiaImage={activeImage} onPressPlaceholder={() => handlePickImage(false)} />

      <View style={commonStyles.buttonRow}>
        <Button title="Gallery" onPress={() => handlePickImage(false)} variant="secondary" />
        <Button title="Camera" onPress={() => handlePickImage(true)} variant="secondary" />
      </View>

      <View style={commonStyles.buttonRow}>
        <Button
          title="Run Async"
          onPress={() => runStyleTransfer(false)}
          disabled={!skiaImage || !isReady || isProcessing}
          loading={isProcessing}
        />
        <Button
          title="Run Sync"
          onPress={() => runStyleTransfer(true)}
          disabled={!skiaImage || !isReady || isProcessing}
          variant="accent"
        />
      </View>

      {styledImage && (
        <View style={commonStyles.buttonRow}>
          <Button
            title={showOriginal ? 'Show Styled' : 'Show Original'}
            onPress={() => setShowOriginal(!showOriginal)}
            variant="secondary"
          />
        </View>
      )}

      <LatencyIndicator latency={latency} />
    </ScrollView>
  );
}

export default function StyleTransferScreen() {
  return (
    <ScreenWrapper>
      <StyleTransferContent />
    </ScreenWrapper>
  );
}
