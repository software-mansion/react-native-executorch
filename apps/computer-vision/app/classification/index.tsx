import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { commonStyles, ColorPalette } from '../../theme';
import { useImage } from '@shopify/react-native-skia';
import { useClassifier, models } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getImage, prepareImage } from '../../utils';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';
import { ImageViewport } from '../../components/ImageViewport';
import { ModelStatus } from '../../components/ModelStatus';
import { LatencyIndicator } from '../../components/LatencyIndicator';
import { Button } from '../../components/Button';

const MODEL_OPTIONS: ModelOption[] = [
  {
    label: 'EfficientNetV2-S (XNNPACK INT8)',
    value: models.classification.EFFICIENTNET_V2_S.XNNPACK_INT8,
  },
  {
    label: 'EfficientNetV2-S (XNNPACK FP32)',
    value: models.classification.EFFICIENTNET_V2_S.XNNPACK_FP32,
  },
  {
    label: 'EfficientNetV2-S (CoreML FP16)',
    value: models.classification.EFFICIENTNET_V2_S.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
];

function ClassificationContent() {
  const [selectedModel, setSelectedModel] = useState<any>(MODEL_OPTIONS[0].value);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ label: string; confidence: number }[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const skiaImage = useImage(imageUri, (err) => setError(err.message || String(err)));

  const {
    isReady,
    downloadProgress,
    error: loadError,
    classify,
    classifyWorklet,
  } = useClassifier<string>(selectedModel);

  const handlePickImage = async (useCamera: boolean) => {
    setError(null);
    try {
      const asset = await getImage(useCamera);
      if (asset?.uri) {
        const uri = await prepareImage(asset.uri);
        setImageUri(uri);
        setResults([]);
        setLatency(null);
      }
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const runClassification = async (sync: boolean) => {
    if (!skiaImage || !classify || !classifyWorklet) return;
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
      const output = sync
        ? classifyWorklet(buffer, { topk: 5 })
        : await classify(buffer, { topk: 5 });

      setLatency(Date.now() - start);
      setResults(output);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      if (!sync) setIsProcessing(false);
    }
  };

  const activeError = loadError ? String(loadError) : error;

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={commonStyles.contentContainer}
    >
      <Text style={commonStyles.description}>
        Upload or capture an image to identify objects using a classifier.
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
        modelTypeLabel="classification model"
      />

      <ImageViewport skiaImage={skiaImage} onPressPlaceholder={() => handlePickImage(false)} />

      <View style={commonStyles.buttonRow}>
        <Button title="Gallery" onPress={() => handlePickImage(false)} variant="secondary" />
        <Button title="Camera" onPress={() => handlePickImage(true)} variant="secondary" />
      </View>

      <View style={commonStyles.buttonRow}>
        <Button
          title="Run Async"
          onPress={() => runClassification(false)}
          disabled={!skiaImage || !isReady || isProcessing}
          loading={isProcessing}
        />
        <Button
          title="Run Sync"
          onPress={() => runClassification(true)}
          disabled={!skiaImage || !isReady || isProcessing}
          variant="accent"
        />
      </View>

      <LatencyIndicator latency={latency} />

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Results</Text>
          {results.map((res, idx) => (
            <View key={idx} style={styles.resultRow}>
              <Text style={styles.resultLabel} numberOfLines={1}>
                {res.label}
              </Text>
              <Text style={styles.resultConfidence}>{Math.round(res.confidence * 100)}%</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export default function ClassificationScreen() {
  return (
    <ScreenWrapper>
      <ClassificationContent />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  resultsContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ColorPalette.strongPrimary,
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  resultLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  resultConfidence: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2b8a3e',
  },
});
