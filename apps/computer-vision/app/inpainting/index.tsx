import React, { useState } from 'react';
import { View, Text, Platform, TouchableOpacity, StyleSheet } from 'react-native';
// The gesture-handler ScrollView yields to the brush pan over the photo, so
// painting never scrolls the page and scrolling still works everywhere else.
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles, theme } from '../../theme';
import {
  useImage,
  Skia,
  ColorType,
  AlphaType,
  type SkImage as SkiaImageType,
} from '@shopify/react-native-skia';
import { useInpainter, models } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getImage, skImageToBuffer } from '../../utils';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';
import { ImageViewport } from '../../components/ImageViewport';
import { ModelStatus } from '../../components/ModelStatus';
import { LatencyIndicator } from '../../components/LatencyIndicator';
import { Button } from '../../components/Button';
import { MaskCanvas, rasterizeMask, type MaskStroke } from '../../components/MaskCanvas';

const MODEL_OPTIONS: ModelOption[] = [
  { label: 'MI-GAN 512 (XNNPACK FP16)', value: models.inpainting.MIGAN.SIZE_512.XNNPACK_FP16 },
  {
    label: 'MI-GAN 512 (CoreML FP16)',
    value: models.inpainting.MIGAN.SIZE_512.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
  {
    label: 'MI-GAN 512 (Vulkan FP16)',
    value: models.inpainting.MIGAN.SIZE_512.VULKAN_FP16,
    disabled: Platform.OS !== 'android',
  },
  { label: 'MI-GAN 256 (XNNPACK FP16)', value: models.inpainting.MIGAN.SIZE_256.XNNPACK_FP16 },
  {
    label: 'MI-GAN 256 (CoreML FP16)',
    value: models.inpainting.MIGAN.SIZE_256.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
  {
    label: 'MI-GAN 256 (Vulkan FP16)',
    value: models.inpainting.MIGAN.SIZE_256.VULKAN_FP16,
    disabled: Platform.OS !== 'android',
  },
  {
    label: 'MI-GAN Faces 256 (XNNPACK FP16)',
    value: models.inpainting.MIGAN.FACES_256.XNNPACK_FP16,
  },
  {
    label: 'MI-GAN Faces 256 (CoreML FP16)',
    value: models.inpainting.MIGAN.FACES_256.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
  {
    label: 'MI-GAN Faces 256 (Vulkan FP16)',
    value: models.inpainting.MIGAN.FACES_256.VULKAN_FP16,
    disabled: Platform.OS !== 'android',
  },
];

/** Brush diameters in image pixels. */
const BRUSH_SIZES = [16, 32, 64] as const;

function InpaintingContent() {
  const insets = useSafeAreaInsets();
  const [selectedModel, setSelectedModel] = useState<any>(MODEL_OPTIONS[0].value);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<readonly MaskStroke[]>([]);
  const [brushWidth, setBrushWidth] = useState<number>(BRUSH_SIZES[1]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<SkiaImageType | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const skiaImage = useImage(imageUri, (err) => setError(err.message || String(err)));

  const {
    isReady,
    downloadProgress,
    error: loadError,
    inpaint,
    inpaintWorklet,
  } = useInpainter(selectedModel);

  const resetResult = () => {
    setResultImage(null);
    setShowOriginal(false);
    setLatency(null);
  };

  const handlePickImage = async (useCamera: boolean) => {
    setError(null);
    try {
      const uri = await getImage(useCamera);
      if (uri) {
        setImageUri(uri);
        setStrokes([]);
        resetResult();
      }
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const runInpainting = async (sync: boolean) => {
    if (!skiaImage || !inpaint || !inpaintWorklet) return;
    if (!sync) setIsProcessing(true);
    setError(null);
    try {
      const image = skImageToBuffer(skiaImage);
      const mask = rasterizeMask(strokes, image.width, image.height);
      if (!mask) throw new Error('Could not rasterize the mask');

      const start = Date.now();
      const output = sync ? inpaintWorklet(image, mask) : await inpaint(image, mask);
      setLatency(Date.now() - start);

      const info = {
        width: output.width,
        height: output.height,
        colorType: ColorType.RGBA_8888,
        alphaType: AlphaType.Premul,
      };
      const result = Skia.Image.MakeImage(info, Skia.Data.fromBytes(output.data), output.width * 4);
      if (!result) throw new Error('Failed to decode the inpainted image in Skia');
      setResultImage(result);
      setShowOriginal(false);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      if (!sync) setIsProcessing(false);
    }
  };

  const activeError = loadError ? String(loadError) : error;
  const showingResult = resultImage !== null && !showOriginal;
  const activeImage = showingResult ? resultImage : skiaImage;
  const canRun = !!skiaImage && isReady && !isProcessing && strokes.length > 0;

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={[
        commonStyles.contentContainer,
        { paddingBottom: insets.bottom + theme.spacing.large },
      ]}
    >
      <Text style={commonStyles.description}>
        Pick a photo, paint over what should disappear, and run the model to fill it in.
      </Text>

      <ModelPicker
        label="Inpainting Model"
        options={MODEL_OPTIONS}
        selectedValue={selectedModel}
        onValueChange={(model) => {
          setSelectedModel(model);
          resetResult();
          setError(null);
        }}
      />

      <ModelStatus
        isReady={isReady}
        downloadProgress={downloadProgress}
        error={activeError}
        modelTypeLabel="inpainting model"
      />

      <ImageViewport skiaImage={activeImage} onPressPlaceholder={() => handlePickImage(false)}>
        {skiaImage && !showingResult && (
          <MaskCanvas
            image={skiaImage}
            strokes={strokes}
            onStrokesChange={setStrokes}
            brushWidth={brushWidth}
            enabled={!isProcessing}
          />
        )}
      </ImageViewport>

      {skiaImage && !showingResult && (
        <View style={styles.brushRow}>
          <Text style={styles.brushLabel}>Brush</Text>
          {BRUSH_SIZES.map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.brushChip, brushWidth === size && styles.brushChipActive]}
              onPress={() => setBrushWidth(size)}
            >
              <Text style={[styles.brushText, brushWidth === size && styles.brushTextActive]}>
                {size}px
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.brushChip}
            onPress={() => {
              setStrokes([]);
              resetResult();
            }}
            disabled={strokes.length === 0}
          >
            <Text style={styles.brushText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={commonStyles.buttonRow}>
        <Button title="Gallery" onPress={() => handlePickImage(false)} variant="secondary" />
        <Button title="Camera" onPress={() => handlePickImage(true)} variant="secondary" />
      </View>

      <View style={commonStyles.buttonRow}>
        <Button
          title="Run Async"
          onPress={() => runInpainting(false)}
          disabled={!canRun}
          loading={isProcessing}
        />
        <Button
          title="Run Sync"
          onPress={() => runInpainting(true)}
          disabled={!canRun}
          variant="accent"
        />
      </View>

      {resultImage && (
        <View style={commonStyles.buttonRow}>
          <Button
            title={showOriginal ? 'Show Result' : 'Show Original'}
            onPress={() => setShowOriginal(!showOriginal)}
            variant="secondary"
          />
        </View>
      )}

      <LatencyIndicator latency={latency} />
    </ScrollView>
  );
}

export default function InpaintingScreen() {
  return (
    <ScreenWrapper>
      <InpaintingContent />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  brushRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  brushLabel: {
    color: theme.colors.textMuted,
    marginRight: 4,
  },
  brushChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  brushChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  brushText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  brushTextActive: {
    color: '#fff',
  },
});
