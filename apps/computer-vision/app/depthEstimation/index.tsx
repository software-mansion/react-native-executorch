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
import { ModelPicker } from '../../components/ModelPicker';
import { ModelStatus } from '../../components/ModelStatus';
import { LatencyIndicator } from '../../components/LatencyIndicator';
import { Button } from '../../components/Button';
import { commonStyles, theme } from '../../theme';
import { getImage, skImageToBuffer } from '../../utils';

const DEPTH_MODELS = models.depthEstimation.DEPTH_ANYTHING_V2_SMALL;
const MODEL_OPTIONS = [
  { label: 'Depth Anything V2 Small (Default)', value: DEPTH_MODELS.DEFAULT },
  { label: 'Depth Anything V2 Small (XNNPACK INT8)', value: DEPTH_MODELS.XNNPACK_INT8 },
  { label: 'Depth Anything V2 Small (XNNPACK FP32)', value: DEPTH_MODELS.XNNPACK_FP32 },
  {
    label: 'Depth Anything V2 Small (CoreML FP16)',
    value: DEPTH_MODELS.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
  {
    label: 'Depth Anything V2 Small (Vulkan FP16)',
    value: DEPTH_MODELS.VULKAN_FP16,
    disabled: Platform.OS !== 'android',
  },
];

type DepthPreview = { image: SkImage; min: number; max: number };

// Display conversion belongs to the demo; the library retains the raw float map.
function createDepthPreview(depth: DepthMap): DepthPreview {
  let min = Infinity;
  let max = -Infinity;
  for (const value of depth.data) {
    if (!Number.isFinite(value)) continue;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  if (!Number.isFinite(min)) throw new Error('The model returned no finite depth values.');
  const range = max - min;
  const rgba = new Uint8Array(depth.width * depth.height * 4);
  for (let i = 0; i < depth.data.length; i++) {
    const value = depth.data[i]!;
    const gray =
      range > 0 && Number.isFinite(value) ? Math.round(((value - min) / range) * 255) : 0;
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
  return { image, min, max };
}

function DepthDemo({
  model,
  busy,
  onBusyChange,
}: {
  model: DepthEstimatorModel;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
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

  const image = useImage(imageUri, (failure) => setError(failure.message));
  const estimator = useDepthEstimator(model);

  const pickImage = async (camera: boolean) => {
    onBusyChange(true);
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
      if (mounted.current) onBusyChange(false);
    }
  };

  const runDepthEstimation = async (sync: boolean) => {
    if (!image || !estimator.estimateDepth || !estimator.estimateDepthWorklet || busy) return;
    onBusyChange(true);
    setError(null);
    try {
      const input = skImageToBuffer(image);
      const start = Date.now();
      const depth = sync
        ? estimator.estimateDepthWorklet(input)
        : await estimator.estimateDepth(input);
      const elapsed = Date.now() - start;
      if (!mounted.current) return;
      setPreview(createDepthPreview(depth));
      setLatency(elapsed);
    } catch (failure) {
      if (mounted.current) setError(String(failure));
    } finally {
      if (mounted.current) onBusyChange(false);
    }
  };

  return (
    <>
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
    </>
  );
}

function DepthEstimationContent() {
  const insets = useSafeAreaInsets();
  const [selectedModel, setSelectedModel] = useState<DepthEstimatorModel>(DEPTH_MODELS.DEFAULT);
  const [busy, setBusy] = useState(false);

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={[
        commonStyles.contentContainer,
        { paddingBottom: insets.bottom + theme.spacing.large },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={commonStyles.description}>
        Turn a photo into a moving scene. Estimate depth once, then explore perspective, focus, and
        the space between subjects.
      </Text>
      <ModelPicker
        label="Model"
        options={MODEL_OPTIONS.map((option) => ({ ...option, disabled: option.disabled || busy }))}
        selectedValue={selectedModel}
        onValueChange={setSelectedModel}
      />
      <DepthDemo
        key={selectedModel.modelPath}
        model={selectedModel}
        busy={busy}
        onBusyChange={setBusy}
      />
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
