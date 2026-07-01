import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles, ColorPalette } from '../../theme';
import { useImage } from '@shopify/react-native-skia';
import { useImageEmbeddings, useTextEmbeddings, models } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getImage, skImageToBuffer } from '../../utils';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';
import { ImageViewport } from '../../components/ImageViewport';
import { ModelStatus } from '../../components/ModelStatus';
import { LatencyIndicator } from '../../components/LatencyIndicator';
import { Button } from '../../components/Button';

const IMAGE_MODEL_OPTIONS: ModelOption[] = [
  {
    label: 'CLIP ViT-B/32 (INT8)',
    value: models.imageEmbeddings.CLIP_VIT_BASE_PATCH32.XNNPACK_INT8,
  },
  {
    label: 'CLIP ViT-B/32 (FP32)',
    value: models.imageEmbeddings.CLIP_VIT_BASE_PATCH32.XNNPACK_FP32,
  },
];

const DEFAULT_LABELS = [
  'a photo of a dog',
  'a photo of a cat',
  'a landscape photo',
  'a photo of food',
  'a photo of people',
];

// CLIP text and image embeddings are L2-normalized, so their cosine similarity
// is the dot product.
const dot = (a: Float32Array, b: Float32Array) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    s += a[i]! * b[i]!;
  }
  return s;
};

function ImageEmbeddingsContent() {
  const [selectedImageModel, setSelectedImageModel] = useState<any>(IMAGE_MODEL_OPTIONS[0].value);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [labels, setLabels] = useState<string[]>(DEFAULT_LABELS);
  const [newLabel, setNewLabel] = useState('');
  const [results, setResults] = useState<{ label: string; score: number }[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insets = useSafeAreaInsets();
  const skiaImage = useImage(imageUri, (err) => setError(err.message || String(err)));

  // Zero-shot classification pairs a CLIP image encoder with the CLIP text
  // encoder and scores the image against each text label by embedding similarity.
  const imageModel = useImageEmbeddings(selectedImageModel);
  const textModel = useTextEmbeddings(models.textEmbeddings.CLIP_VIT_BASE_PATCH32_TEXT);

  const ready = imageModel.isReady && textModel.isReady;

  const pickImage = async () => {
    setError(null);
    try {
      const uri = await getImage(false);
      if (!uri) return;
      setImageUri(uri);
      setResults([]);
      setLatency(null);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const classify = async () => {
    if (!skiaImage || !ready || !imageModel.forward || !textModel.forward) return;
    setIsProcessing(true);
    setError(null);
    try {
      const start = Date.now();
      const imageEmbedding = await imageModel.forward(skImageToBuffer(skiaImage));
      const scored: { label: string; score: number }[] = [];
      for (const label of labels) {
        const textEmbedding = await textModel.forward(label);
        scored.push({ label, score: dot(imageEmbedding, textEmbedding) });
      }
      scored.sort((a, b) => b.score - a.score);
      setLatency(Date.now() - start);
      setResults(scored);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setIsProcessing(false);
    }
  };

  const addLabel = () => {
    const trimmed = newLabel.trim();
    if (!trimmed || labels.includes(trimmed)) return;
    setLabels((prev) => [...prev, trimmed]);
    setNewLabel('');
    setResults([]);
  };

  const removeLabel = (label: string) => {
    setLabels((prev) => prev.filter((l) => l !== label));
    setResults((prev) => prev.filter((r) => r.label !== label));
  };

  const activeError = imageModel.error
    ? String(imageModel.error)
    : textModel.error
      ? String(textModel.error)
      : error;

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={[commonStyles.contentContainer, { paddingBottom: insets.bottom + 24 }]}
    >
      <Text style={commonStyles.description}>
        Pick an image, then rank text labels by how well CLIP matches them to it (zero-shot
        classification).
      </Text>

      <ModelPicker
        label="Image model"
        options={IMAGE_MODEL_OPTIONS}
        selectedValue={selectedImageModel}
        onValueChange={(model) => {
          setSelectedImageModel(model);
          setResults([]);
          setLatency(null);
        }}
      />

      <ModelStatus
        isReady={ready}
        downloadProgress={Math.min(imageModel.downloadProgress, textModel.downloadProgress)}
        error={activeError}
        modelTypeLabel="CLIP models"
      />

      <ImageViewport skiaImage={skiaImage} onPressPlaceholder={pickImage} />

      <View style={commonStyles.buttonRow}>
        <Button title="Pick image" onPress={pickImage} variant="secondary" />
        <Button
          title="Find best label"
          onPress={classify}
          disabled={!skiaImage || !ready || isProcessing}
          loading={isProcessing}
        />
      </View>

      <LatencyIndicator latency={latency} />

      {results.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Results</Text>
          {results.map((r, i) => (
            <View key={r.label} style={styles.row}>
              <Text style={[styles.rowLabel, i === 0 && styles.topLabel]} numberOfLines={1}>
                {i === 0 ? '🥇 ' : ''}
                {r.label}
              </Text>
              <Text style={styles.rowScore}>{r.score.toFixed(3)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Labels</Text>
        {labels.map((label) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel} numberOfLines={1}>
              {label}
            </Text>
            <TouchableOpacity onPress={() => removeLabel(label)} hitSlop={8}>
              <Text style={styles.remove}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a label…"
            placeholderTextColor="#94A3B8"
            value={newLabel}
            onChangeText={setNewLabel}
            onSubmitEditing={addLabel}
            returnKeyType="done"
          />
          <Button title="Add" onPress={addLabel} disabled={!newLabel.trim()} variant="secondary" />
        </View>
      </View>
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
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ColorPalette.strongPrimary,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  rowLabel: { fontSize: 14, color: '#334155', flex: 1, marginRight: 8 },
  topLabel: { fontWeight: '700', color: ColorPalette.strongPrimary },
  rowScore: { fontSize: 13, fontWeight: '600', color: ColorPalette.primary },
  remove: { fontSize: 16, color: '#94A3B8', paddingHorizontal: 4 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  input: {
    flex: 1,
    backgroundColor: '#f1f3f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
});
