import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Switch } from 'react-native';
import { commonStyles, ColorPalette } from '../../theme';
import { useImage } from '@shopify/react-native-skia';
import { useOCR, models, type OCRDetection } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getImage } from '../../utils';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';
import { ImageViewport } from '../../components/ImageViewport';
import { ModelStatus } from '../../components/ModelStatus';
import { Button } from '../../components/Button';

const PREVIEW_HEIGHT = 280;

// Hosted PTEs — downloaded + cached on-device from Hugging Face by `useOCR`.
// Backends per platform: XNNPACK runs everywhere, Vulkan on Android, CoreML on iOS.
const ALL_MODELS = [
  {
    label: 'PaddleOCR (XNNPACK)',
    config: models.ocr.PADDLE.PPOCRV6_SMALL.XNNPACK,
    platforms: ['ios', 'android'],
  },
  {
    label: 'PaddleOCR (Vulkan)',
    config: models.ocr.PADDLE.PPOCRV6_SMALL.VULKAN,
    platforms: ['android'],
  },
  {
    label: 'PaddleOCR (CoreML)',
    config: models.ocr.PADDLE.PPOCRV6_SMALL.COREML,
    platforms: ['ios'],
  },
  {
    label: 'EasyOCR English (XNNPACK)',
    config: models.ocr.EASYOCR.ENGLISH.XNNPACK,
    platforms: ['ios', 'android'],
  },
  {
    label: 'EasyOCR English (Vulkan)',
    config: models.ocr.EASYOCR.ENGLISH.VULKAN,
    platforms: ['android'],
  },
  {
    label: 'EasyOCR English (CoreML)',
    config: models.ocr.EASYOCR.ENGLISH.COREML,
    platforms: ['ios'],
  },
];

const OCR_MODELS = ALL_MODELS.filter((m) => m.platforms.includes(Platform.OS));

const MODEL_OPTIONS: ModelOption[] = OCR_MODELS.map((m, i) => ({ label: m.label, value: i }));

function OCRContent() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [vertical, setVertical] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<OCRDetection[]>([]);
  const [wallMs, setWallMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = OCR_MODELS[selectedIdx]!;

  const skiaImage = useImage(imageUri, (err) => setError(err.message || String(err)));

  // `useOCR` downloads + caches the hosted PTE from its Hugging Face URL.
  const { isReady, downloadProgress, error: loadError, runOCR } = useOCR(selected.config);

  const handlePickImage = async (useCamera: boolean) => {
    setError(null);
    try {
      const uri = await getImage(useCamera);
      if (uri) {
        setImageUri(uri);
        setResults([]);
        setWallMs(null);
      }
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const runRecognition = async () => {
    if (!skiaImage || !runOCR) return;
    setIsProcessing(true);
    setError(null);
    try {
      const pixels = skiaImage.readPixels();
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
      // `vertical` is a per-run option now — toggling it needs no model reload.
      const output = await runOCR(buffer, { vertical });
      setWallMs(Date.now() - start);
      setResults(output.detections);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setIsProcessing(false);
    }
  };

  const activeError = loadError ? String(loadError) : error;

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={commonStyles.contentContainer}
    >
      <Text style={commonStyles.description}>
        Upload or capture an image to detect and recognize text on-device.
      </Text>

      <ModelPicker
        label="Model"
        options={MODEL_OPTIONS}
        selectedValue={selectedIdx}
        onValueChange={(idx) => {
          setSelectedIdx(idx);
          setResults([]);
          setWallMs(null);
          setError(null);
        }}
      />

      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleLabel}>Vertical text</Text>
          <Text style={styles.toggleHint}>
            Read upright stacked columns (character-under-character)
          </Text>
        </View>
        <Switch value={vertical} onValueChange={setVertical} />
      </View>

      <ModelStatus
        isReady={isReady}
        downloadProgress={downloadProgress}
        error={activeError}
        modelTypeLabel="OCR model"
      />

      <ImageViewport
        skiaImage={skiaImage}
        height={PREVIEW_HEIGHT}
        boxes={results.map((r) => r.quad)}
        onPressPlaceholder={() => handlePickImage(false)}
      />

      <View style={commonStyles.buttonRow}>
        <Button title="Gallery" onPress={() => handlePickImage(false)} variant="secondary" />
        <Button title="Camera" onPress={() => handlePickImage(true)} variant="secondary" />
      </View>

      <View style={commonStyles.buttonRow}>
        <Button
          title="Run OCR"
          onPress={runRecognition}
          disabled={!skiaImage || !isReady || isProcessing}
          loading={isProcessing}
        />
      </View>

      {wallMs !== null && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Performance</Text>
          <View style={styles.statTiles}>
            <View style={styles.tile}>
              <Text style={styles.tileValue}>
                {wallMs}
                <Text style={styles.tileUnit}> ms</Text>
              </Text>
              <Text style={styles.tileLabel}>Wall time</Text>
            </View>
            <View style={styles.tile}>
              <Text style={styles.tileValue}>{results.length}</Text>
              <Text style={styles.tileLabel}>Regions read</Text>
            </View>
          </View>
        </View>
      )}

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Detected text ({results.length})</Text>
          {results.map((res, idx) => (
            <View key={idx} style={styles.resultRow}>
              <Text style={styles.resultLabel} numberOfLines={1}>
                {res.text}
              </Text>
              <View style={styles.resultMeta}>
                <Text style={styles.resultMs}>{res.recognizeMs.toFixed(0)}ms</Text>
                <Text style={styles.resultConfidence}>{Math.round(res.confidence * 100)}%</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export default function OCRScreen() {
  return (
    <ScreenWrapper>
      <OCRContent />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  toggleText: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: ColorPalette.strongPrimary },
  toggleHint: { fontSize: 12, color: '#868e96', marginTop: 2 },
  statsCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#868e96',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  statTiles: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: '#f2f4ff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  tileValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#001A72',
    fontVariant: ['tabular-nums'],
  },
  tileUnit: { fontSize: 14, fontWeight: '600', color: '#6b73a3' },
  tileLabel: { fontSize: 11, color: '#868e96', marginTop: 4 },
  resultMeta: { flexDirection: 'row', alignItems: 'center' },
  resultMs: {
    fontSize: 12,
    color: '#868e96',
    marginRight: 10,
    fontVariant: ['tabular-nums'],
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
