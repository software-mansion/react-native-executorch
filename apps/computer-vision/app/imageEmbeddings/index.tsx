import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { commonStyles, ColorPalette } from '../../theme';
import { useImage, type SkImage } from '@shopify/react-native-skia';
import { useImageEmbeddings, models } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getImage } from '../../utils';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';
import { ImageViewport } from '../../components/ImageViewport';
import { ModelStatus } from '../../components/ModelStatus';
import { LatencyIndicator } from '../../components/LatencyIndicator';
import { Button } from '../../components/Button';

const MODEL_OPTIONS: ModelOption[] = [
  {
    label: 'CLIP ViT-B/32 (XNNPACK INT8)',
    value: models.imageEmbeddings.CLIP_VIT_BASE_PATCH32.XNNPACK_INT8,
  },
  {
    label: 'CLIP ViT-B/32 (XNNPACK FP32)',
    value: models.imageEmbeddings.CLIP_VIT_BASE_PATCH32.XNNPACK_FP32,
  },
];

// CLIP image embeddings are L2-normalized, so cosine similarity is the dot
// product.
const cosine = (a: Float32Array, b: Float32Array) => {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
  }
  return dot;
};

const toBuffer = (img: SkImage) => {
  const pixels = img.readPixels();
  if (!(pixels instanceof Uint8Array)) {
    throw new Error('Expected Uint8Array from readPixels');
  }
  return {
    data: pixels,
    width: img.width(),
    height: img.height(),
    format: 'rgba' as const,
    layout: 'hwc' as const,
  };
};

function ImageEmbeddingsContent() {
  const [selectedModel, setSelectedModel] = useState<any>(MODEL_OPTIONS[0].value);
  const [uriA, setUriA] = useState<string | null>(null);
  const [uriB, setUriB] = useState<string | null>(null);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageA = useImage(uriA, (err) => setError(err.message || String(err)));
  const imageB = useImage(uriB, (err) => setError(err.message || String(err)));

  const {
    isReady,
    downloadProgress,
    error: loadError,
    forward,
  } = useImageEmbeddings(selectedModel);

  const pick = async (slot: 'A' | 'B') => {
    setError(null);
    try {
      const uri = await getImage(false);
      if (!uri) return;
      if (slot === 'A') setUriA(uri);
      else setUriB(uri);
      setSimilarity(null);
      setLatency(null);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const compare = async () => {
    if (!imageA || !imageB || !forward) return;
    setIsProcessing(true);
    setError(null);
    try {
      const start = Date.now();
      const [embA, embB] = await Promise.all([
        forward(toBuffer(imageA)),
        forward(toBuffer(imageB)),
      ]);
      setLatency(Date.now() - start);
      setSimilarity(cosine(embA, embB));
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setIsProcessing(false);
    }
  };

  const activeError = loadError ? String(loadError) : error;
  const pct = similarity === null ? null : Math.max(0, Math.min(100, Math.round(similarity * 100)));

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={commonStyles.contentContainer}
    >
      <Text style={commonStyles.description}>
        Pick two images and compare how similar CLIP finds them (cosine similarity of their
        embeddings).
      </Text>

      <ModelPicker
        label="Model"
        options={MODEL_OPTIONS}
        selectedValue={selectedModel}
        onValueChange={(model) => {
          setSelectedModel(model);
          setSimilarity(null);
          setLatency(null);
          setError(null);
        }}
      />

      <ModelStatus
        isReady={isReady}
        downloadProgress={downloadProgress}
        error={activeError}
        modelTypeLabel="image embeddings model"
      />

      <View style={styles.pair}>
        <View style={styles.slot}>
          <ImageViewport skiaImage={imageA} onPressPlaceholder={() => pick('A')} />
          <Text style={styles.slotLabel}>Image A</Text>
        </View>
        <View style={styles.slot}>
          <ImageViewport skiaImage={imageB} onPressPlaceholder={() => pick('B')} />
          <Text style={styles.slotLabel}>Image B</Text>
        </View>
      </View>

      <View style={commonStyles.buttonRow}>
        <Button title="Pick A" onPress={() => pick('A')} variant="secondary" />
        <Button title="Pick B" onPress={() => pick('B')} variant="secondary" />
      </View>

      <Button
        title="Compare"
        onPress={compare}
        disabled={!imageA || !imageB || !isReady || isProcessing}
        loading={isProcessing}
      />

      <LatencyIndicator latency={latency} />

      {pct !== null && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Similarity</Text>
          <Text style={styles.resultValue}>{pct}%</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${pct}%` }]} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

export default function ImageEmbeddingsScreen() {
  return (
    <ScreenWrapper>
      <ImageEmbeddingsContent />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  pair: {
    flexDirection: 'row',
    gap: 12,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
  },
  slotLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
  },
  result: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ColorPalette.strongPrimary,
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: '700',
    color: ColorPalette.primary,
    marginBottom: 12,
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f1f3f5',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: ColorPalette.primary,
  },
});
