import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Skia } from '@shopify/react-native-skia';
import { useClassifier, models } from 'react-native-executorch';
import ScreenWrapper from '../../ScreenWrapper';
import ColorPalette from '../../colors';
import { getImage } from '../../utils';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';

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
  },
];

async function loadImageBuffer(uri: string) {
  const data = await Skia.Data.fromURI(uri);
  const img = Skia.Image.MakeImageFromEncoded(data);
  if (!img) {
    throw new Error('Failed to decode image using Skia');
  }
  return {
    data: img.readPixels() as Uint8Array,
    width: img.width(),
    height: img.height(),
    format: 'rgba' as const,
    layout: 'hwc' as const,
  };
}

export default function ClassificationScreen() {
  const [selectedModel, setSelectedModel] = useState<any>(MODEL_OPTIONS[0].value);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ label: string; confidence: number }[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    isReady,
    downloadProgress,
    error: loadError,
    classify,
    classifyWorklet,
  } = useClassifier<string>(selectedModel);

  const handlePickImage = async (useCamera: boolean) => {
    const asset = await getImage(useCamera);
    if (asset?.uri) {
      setImageUri(asset.uri);
      setResults([]);
      setLatency(null);
      setError(null);
    }
  };

  const runClassification = async (sync: boolean) => {
    if (!imageUri || !classify || !classifyWorklet) return;
    if (!sync) setLoading(true);
    setError(null);
    try {
      const inputBuffer = await loadImageBuffer(imageUri);
      const start = Date.now();
      const output = sync
        ? classifyWorklet(inputBuffer, { topk: 5 })
        : await classify(inputBuffer, { topk: 5 });
      setLatency(Date.now() - start);
      setResults(output);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      if (!sync) setLoading(false);
    }
  };

  const activeError = loadError ? String(loadError) : error;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Image Classification</Text>

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

        {!isReady && !activeError && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color={ColorPalette.primary} />
            <Text style={styles.progressText}>
              Downloading Model... {downloadProgress ? `${Math.round(downloadProgress)}%` : '0%'}
            </Text>
          </View>
        )}

        {activeError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{activeError}</Text>
          </View>
        )}

        <View style={styles.imageCard}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => handlePickImage(false)}>
            <Text style={styles.btnTextSecondary}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => handlePickImage(true)}>
            <Text style={styles.btnTextSecondary}>Camera</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.btnPrimary, (!imageUri || !isReady || loading) && styles.btnDisabled]}
            onPress={() => runClassification(false)}
            disabled={!imageUri || !isReady || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnTextPrimary}>Run Async</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnSecondary, (!imageUri || !isReady || loading) && styles.btnDisabled]}
            onPress={() => runClassification(true)}
            disabled={!imageUri || !isReady || loading}
          >
            <Text style={styles.btnTextSecondary}>Run Sync</Text>
          </TouchableOpacity>
        </View>

        {latency !== null && (
          <Text style={styles.latencyText}>Inference Latency: {latency} ms</Text>
        )}

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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: ColorPalette.strongPrimary,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffe3e3',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignSelf: 'stretch',
  },
  errorText: {
    color: '#d63031',
    fontSize: 14,
    textAlign: 'center',
  },
  imageCard: {
    width: '100%',
    height: 250,
    backgroundColor: '#f1f3f5',
    borderRadius: 12,
    marginVertical: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#868e96',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 12,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: ColorPalette.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: ColorPalette.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnTextPrimary: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnTextSecondary: {
    color: ColorPalette.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  latencyText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 12,
  },
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
