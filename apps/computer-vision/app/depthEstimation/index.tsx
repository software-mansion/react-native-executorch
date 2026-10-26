import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlphaType, ColorType, Skia, useImage, type SkImage } from '@shopify/react-native-skia';
import {
  useDepthEstimator,
  models,
  type DepthMap,
  type DepthEstimatorModel,
} from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ImageViewport } from '../../components/ImageViewport';
import { DepthPhoto } from '../../components/DepthPhoto';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';
import { ModelStatus } from '../../components/ModelStatus';
import { LatencyIndicator } from '../../components/LatencyIndicator';
import { Button } from '../../components/Button';
import { commonStyles, theme } from '../../theme';
import { getImage, skImageToBuffer } from '../../utils';

const DEPTH_MODELS = models.depthEstimation.DEPTH_ANYTHING_V2_SMALL;
const DEPTH_V3_MODELS = models.depthEstimation.DEPTH_ANYTHING_V3_SMALL;
const ZIPDEPTH_MODELS = models.depthEstimation.ZIPDEPTH_BASE;
type Backend = 'xnnpack' | 'coreml' | 'vulkan';
type DepthModelOption = ModelOption & { family: 'v2' | 'v3' | 'zipdepth' };
const BACKEND_OPTIONS: ModelOption[] = [
  { label: 'XNNPACK', value: 'xnnpack' },
  { label: 'Core ML', value: 'coreml', disabled: Platform.OS !== 'ios' },
  { label: 'Vulkan', value: 'vulkan', disabled: Platform.OS !== 'android' },
];
const MODEL_OPTIONS: Record<Backend, DepthModelOption[]> = {
  xnnpack: [
    { label: 'Depth Anything V2 Small (INT8)', family: 'v2', value: DEPTH_MODELS.XNNPACK_INT8 },
    { label: 'Depth Anything V2 Small (FP32)', family: 'v2', value: DEPTH_MODELS.XNNPACK_FP32 },
    { label: 'Depth Anything V3 Small (INT8)', family: 'v3', value: DEPTH_V3_MODELS.XNNPACK_INT8 },
    { label: 'Depth Anything V3 Small (FP32)', family: 'v3', value: DEPTH_V3_MODELS.XNNPACK_FP32 },
    { label: 'ZipDepth Base (FP32)', family: 'zipdepth', value: ZIPDEPTH_MODELS.XNNPACK_FP32 },
  ],
  coreml: [
    { label: 'Depth Anything V2 Small (FP16)', family: 'v2', value: DEPTH_MODELS.COREML_FP16 },
    { label: 'Depth Anything V3 Small (FP16)', family: 'v3', value: DEPTH_V3_MODELS.COREML_FP16 },
    { label: 'ZipDepth Base (FP32)', family: 'zipdepth', value: ZIPDEPTH_MODELS.COREML_FP32 },
  ],
  vulkan: [
    { label: 'Depth Anything V2 Small (FP16)', family: 'v2', value: DEPTH_MODELS.VULKAN_FP16 },
    { label: 'Depth Anything V3 Small (FP16)', family: 'v3', value: DEPTH_V3_MODELS.VULKAN_FP16 },
    { label: 'ZipDepth Base (FP16)', family: 'zipdepth', value: ZIPDEPTH_MODELS.VULKAN_FP16 },
  ],
};

type DepthPreview = { image: SkImage; min: number; max: number };

// Display conversion belongs to the demo; the library retains the raw float map.
function createDepthPreview(depth: DepthMap, isDepth: boolean): DepthPreview {
  // Effects use inverse depth so near surfaces retain contrast across model families.
  const values = isDepth
    ? depth.data.map((value) => (Number.isFinite(value) && value > 0 ? 1 / value : NaN))
    : depth.data;
  let rawMin = Infinity;
  let rawMax = -Infinity;
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    const raw = depth.data[i]!;
    if (Number.isFinite(raw)) {
      rawMin = Math.min(rawMin, raw);
      rawMax = Math.max(rawMax, raw);
    }
    const value = values[i]!;
    if (!Number.isFinite(value)) continue;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  if (!Number.isFinite(min))
    throw new Error('The model returned no valid depth values for the preview.');
  const range = max - min;
  const rgba = new Uint8Array(depth.width * depth.height * 4);
  for (let i = 0; i < depth.data.length; i++) {
    const value = values[i]!;
    const normalized = range > 0 && Number.isFinite(value) ? (value - min) / range : 0;
    const gray = Math.round(normalized * 255);
    rgba[i * 4] = gray;
    rgba[i * 4 + 1] = gray;
    rgba[i * 4 + 2] = gray;
    rgba[i * 4 + 3] = 255;
  }
  const image = Skia.Image.MakeImage(
    {
      width: depth.width,
      height: depth.height,
      colorType: ColorType.RGBA_8888,
      alphaType: AlphaType.Opaque,
    },
    Skia.Data.fromBytes(rgba),
    depth.width * 4
  );
  if (!image) throw new Error('Failed to render the depth preview.');
  return { image, min: rawMin, max: rawMax };
}

function DepthEstimationContent() {
  const insets = useSafeAreaInsets();
  const [selectedBackend, setSelectedBackend] = useState<Backend>('xnnpack');
  const [selectedModel, setSelectedModel] = useState<DepthEstimatorModel>(
    MODEL_OPTIONS.xnnpack[0]!.value
  );
  const [busy, setBusy] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [preview, setPreview] = useState<DepthPreview | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const selectedOption = MODEL_OPTIONS[selectedBackend].find(
    (option) => option.value === selectedModel
  )!;
  const image = useImage(imageUri, (failure) => setError(failure.message));
  const estimator = useDepthEstimator(selectedModel);

  const selectModel = (model: DepthEstimatorModel) => {
    if (busy || model === selectedModel) return;
    setSelectedModel(model);
    setPreview(null);
    setLatency(null);
    setError(null);
  };

  const selectBackend = (backend: Backend) => {
    if (busy || backend === selectedBackend) return;
    const nextModel =
      MODEL_OPTIONS[backend].find((option) => option.family === selectedOption.family) ??
      MODEL_OPTIONS[backend][0]!;
    setSelectedBackend(backend);
    selectModel(nextModel.value);
  };

  const pickImage = async (camera: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const uri = await getImage(camera);
      if (uri && mounted.current) {
        setImageUri(uri);
        setPreview(null);
        setLatency(null);
      }
    } catch (failure) {
      if (mounted.current) setError(String(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const runDepthEstimation = async (sync: boolean) => {
    if (!image || !estimator.estimateDepth || !estimator.estimateDepthWorklet || busy) return;
    setBusy(true);
    setError(null);
    try {
      const input = skImageToBuffer(image);
      const start = Date.now();
      const depth = sync
        ? estimator.estimateDepthWorklet(input)
        : await estimator.estimateDepth(input);
      const elapsed = Date.now() - start;
      if (!mounted.current) return;
      setPreview(createDepthPreview(depth, selectedOption.family === 'v3'));
      setLatency(elapsed);
    } catch (failure) {
      if (mounted.current) setError(String(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={[
        commonStyles.contentContainer,
        { paddingBottom: insets.bottom + theme.spacing.large },
      ]}
    >
      <Text style={commonStyles.description}>
        Turn a photo into a moving scene. Estimate depth once, then explore perspective, focus, and
        the space between subjects.
      </Text>
      <ModelPicker
        label="Backend"
        options={BACKEND_OPTIONS}
        selectedValue={selectedBackend}
        onValueChange={selectBackend}
      />
      <ModelPicker
        label="Model"
        options={MODEL_OPTIONS[selectedBackend]}
        selectedValue={selectedModel}
        onValueChange={selectModel}
      />
      <ModelStatus
        isReady={estimator.isReady}
        downloadProgress={estimator.downloadProgress}
        error={estimator.error ? String(estimator.error) : error}
        modelTypeLabel="depth model"
      />
      {preview && image ? (
        <DepthPhoto key={imageUri} image={image} depthTexture={preview.image} />
      ) : (
        <ImageViewport
          skiaImage={image}
          onPressPlaceholder={() => {
            if (!busy) pickImage(false);
          }}
        />
      )}
      <View style={commonStyles.buttonRow}>
        <Button
          title="Gallery"
          onPress={() => pickImage(false)}
          disabled={busy}
          variant="secondary"
        />
        <Button
          title="Camera"
          onPress={() => pickImage(true)}
          disabled={busy}
          variant="secondary"
        />
      </View>
      <View style={commonStyles.buttonRow}>
        <Button
          title="Run Async"
          onPress={() => runDepthEstimation(false)}
          disabled={!image || !estimator.isReady || busy}
        />
        <Button
          title="Run Sync"
          onPress={() => runDepthEstimation(true)}
          disabled={!image || !estimator.isReady || busy}
          variant="accent"
        />
      </View>
      {preview && (
        <Text style={commonStyles.description}>
          Raw relative depth: {preview.min.toFixed(3)}–{preview.max.toFixed(3)}. Values are not
          meters.
        </Text>
      )}
      <LatencyIndicator latency={latency} />
    </ScrollView>
  );
}

export default function DepthEstimationScreen() {
  return (
    <ScreenWrapper>
      <DepthEstimationContent />
    </ScreenWrapper>
  );
}
