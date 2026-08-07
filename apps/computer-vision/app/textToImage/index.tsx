import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Platform } from 'react-native';
import * as Device from 'expo-device';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles, theme } from '../../theme';
import {
  Skia,
  ColorType,
  AlphaType,
  type SkImage as SkiaImageType,
} from '@shopify/react-native-skia';
import { useTextToImage, models } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';
import { ImageViewport } from '../../components/ImageViewport';
import { ModelStatus } from '../../components/ModelStatus';
import { LatencyIndicator } from '../../components/LatencyIndicator';
import { Button } from '../../components/Button';
import { describeError } from '../../errors';

// The CoreML variant delegates to hardware the iOS Simulator does not provide
// (it fails to compile the UNet there), so it is only offered on a physical device.
const isPhysicalIos = Platform.OS === 'ios' && Device.isDevice;

const MODEL_OPTIONS: ModelOption[] = [
  {
    label: 'SDXS-512-DreamShaper (XNNPACK FP32)',
    value: models.textToImage.SDXS_512_DREAMSHAPER.XNNPACK_FP32,
  },
  {
    label: 'SDXS-512-DreamShaper (CoreML FP16)',
    value: models.textToImage.SDXS_512_DREAMSHAPER.COREML_FP16,
    disabled: !isPhysicalIos,
  },
];

function TextToImageContent() {
  const insets = useSafeAreaInsets();
  const [selectedModel, setSelectedModel] = useState<any>(MODEL_OPTIONS[0].value);
  const [prompt, setPrompt] = useState('a close-up picture of an old man standing in the rain');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<SkiaImageType | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    isReady,
    downloadProgress,
    error: loadError,
    generate,
    generateWorklet,
  } = useTextToImage(selectedModel);

  const runGenerate = async (sync: boolean) => {
    if (!generate || !generateWorklet || !prompt.trim()) return;
    if (!sync) setIsProcessing(true);
    setError(null);
    try {
      const start = Date.now();
      const output = sync ? generateWorklet(prompt) : await generate(prompt);
      setLatency(Date.now() - start);

      const outData = Skia.Data.fromBytes(output.data);
      const info = {
        width: output.width,
        height: output.height,
        colorType: ColorType.RGBA_8888,
        alphaType: AlphaType.Premul,
      };
      const skiaImage = Skia.Image.MakeImage(info, outData, output.width * 4);
      if (skiaImage) {
        setGeneratedImage(skiaImage);
      } else {
        throw new Error('Failed to decode generated image in Skia');
      }
    } catch (e) {
      setError(describeError(e));
    } finally {
      if (!sync) setIsProcessing(false);
    }
  };

  const activeError = loadError ? describeError(loadError) : error;

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={[
        commonStyles.contentContainer,
        { paddingBottom: insets.bottom + theme.spacing.large },
      ]}
    >
      <Text style={commonStyles.description}>
        Generate a 512×512 image from a text prompt with the single-step SDXS diffusion pipeline.
      </Text>

      <ModelPicker
        label="Diffusion Model"
        options={MODEL_OPTIONS}
        selectedValue={selectedModel}
        onValueChange={(model) => {
          setSelectedModel(model);
          setGeneratedImage(null);
          setLatency(null);
          setError(null);
        }}
      />

      <ModelStatus
        isReady={isReady}
        downloadProgress={downloadProgress}
        error={activeError}
        modelTypeLabel="text-to-image model"
      />

      <TextInput
        style={styles.promptInput}
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Describe the image you want to generate…"
        placeholderTextColor={theme.colors.textMuted}
        multiline
        editable={!isProcessing}
      />

      <ImageViewport
        skiaImage={generatedImage}
        onPressPlaceholder={() => runGenerate(false)}
        placeholderText="The generated image will appear here"
      />

      <View style={commonStyles.buttonRow}>
        <Button
          title="Generate (Async)"
          onPress={() => runGenerate(false)}
          disabled={!isReady || isProcessing || !prompt.trim()}
          loading={isProcessing}
        />
        <Button
          title="Generate (Sync)"
          onPress={() => runGenerate(true)}
          disabled={!isReady || isProcessing || !prompt.trim()}
          variant="accent"
        />
      </View>

      <LatencyIndicator latency={latency} />

      {Platform.OS === 'android' && <View style={{ height: theme.spacing.large }} />}
    </ScrollView>
  );
}

export default function TextToImageScreen() {
  return (
    <ScreenWrapper>
      <TextToImageContent />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  promptInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.large,
    padding: theme.spacing.medium,
    marginBottom: 20,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.placeholderBackground,
    textAlignVertical: 'top',
  },
});
