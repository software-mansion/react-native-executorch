import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles, ColorPalette, theme } from '../../theme';
import { useImage, ColorType, AlphaType } from '@shopify/react-native-skia';
import { useOcr, models, type OcrDetection, type OcrModel } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getImage } from '../../utils';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';
import { ImageViewport } from '../../components/ImageViewport';
import { ModelStatus } from '../../components/ModelStatus';
import { Button } from '../../components/Button';

// Every variant is listed on both platforms; the ones the platform can't run are
// shown disabled (CoreML is Apple-only, Vulkan is the Android GPU delegate).
const isIos = Platform.OS === 'ios';
const OCR_MODELS: { label: string; base: OcrModel; disabled: boolean }[] = [
  {
    label: 'PaddleOCR (XNNPACK)',
    base: models.ocr.PADDLE.PPOCRV6_SMALL.XNNPACK,
    disabled: false,
  },
  {
    label: 'PaddleOCR (Vulkan)',
    base: models.ocr.PADDLE.PPOCRV6_SMALL.VULKAN,
    disabled: isIos,
  },
  {
    label: 'PaddleOCR (CoreML)',
    base: models.ocr.PADDLE.PPOCRV6_SMALL.COREML,
    disabled: !isIos,
  },
];

const MODEL_OPTIONS: ModelOption[] = OCR_MODELS.map((m, i) => ({
  label: m.label,
  value: i,
  disabled: m.disabled,
}));

function OCRContent() {
  const insets = useSafeAreaInsets();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detections, setDetections] = useState<OcrDetection[]>([]);
  const [wallMs, setWallMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = OCR_MODELS[selectedIdx]!;
  const skiaImage = useImage(imageUri, (err) => setError(err.message || String(err)));

  const { isReady, downloadProgress, error: loadError, runOcr } = useOcr(selected.base);

  const resetResults = () => {
    setDetections([]);
    setWallMs(null);
  };

  const handlePick = async (useCamera: boolean) => {
    setError(null);
    try {
      const uri = await getImage(useCamera);
      if (uri) {
        setImageUri(uri);
        resetResults();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const run = async () => {
    if (!skiaImage || !runOcr) return;
    setIsProcessing(true);
    setError(null);
    try {
      const pixels = skiaImage.readPixels(0, 0, {
        width: skiaImage.width(),
        height: skiaImage.height(),
        colorType: ColorType.RGBA_8888,
        alphaType: AlphaType.Unpremul,
      });
      if (!(pixels instanceof Uint8Array)) throw new Error('Expected Uint8Array from readPixels');
      const start = Date.now();
      const out = await runOcr({
        data: pixels,
        width: skiaImage.width(),
        height: skiaImage.height(),
        format: 'rgba' as const,
        layout: 'hwc' as const,
      });
      setWallMs(Date.now() - start);
      setDetections(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsProcessing(false);
    }
  };

  const activeError = loadError ? String(loadError) : error;
  const boxes = useMemo(() => detections.map((d) => d.quad), [detections]);

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={[
        commonStyles.contentContainer,
        { paddingBottom: insets.bottom + theme.spacing.large },
      ]}
    >
      <Text style={commonStyles.description}>
        Detect and recognize text on-device: every text line is located, cropped and read, and the
        results come back in reading order.
      </Text>

      <ModelPicker
        label="Model"
        options={MODEL_OPTIONS}
        selectedValue={selectedIdx}
        onValueChange={(idx) => {
          setSelectedIdx(idx);
          resetResults();
          setError(null);
        }}
      />

      <ModelStatus
        isReady={isReady}
        downloadProgress={downloadProgress}
        error={activeError}
        modelTypeLabel="OCR model"
      />

      <ImageViewport
        skiaImage={skiaImage}
        boxes={boxes}
        onPressPlaceholder={() => handlePick(false)}
      />

      <View style={commonStyles.buttonRow}>
        <Button title="Gallery" onPress={() => handlePick(false)} variant="secondary" />
        <Button title="Camera" onPress={() => handlePick(true)} variant="secondary" />
      </View>
      <View style={commonStyles.buttonRow}>
        <Button
          title="Run OCR"
          onPress={run}
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
              <Text style={styles.tileValue}>{detections.length}</Text>
              <Text style={styles.tileLabel}>Regions read</Text>
            </View>
          </View>
        </View>
      )}

      {detections.length > 0 && (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>Detected text ({detections.length})</Text>
          {detections.map((d, i) => (
            <View key={i} style={styles.resultRow}>
              <Text style={styles.resultLabel} numberOfLines={1}>
                {d.text}
              </Text>
              <Text style={styles.resultConfidence}>{Math.round(d.confidence * 100)}%</Text>
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
  statsCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
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
  statTiles: { flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1,
    backgroundColor: '#f2f4ff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  tileValue: { fontSize: 24, fontWeight: '800', color: '#001A72', fontVariant: ['tabular-nums'] },
  tileUnit: { fontSize: 14, fontWeight: '600', color: '#6b73a3' },
  tileLabel: { fontSize: 11, color: '#868e96', marginTop: 4 },
  results: {
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
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  resultLabel: { fontSize: 14, color: '#333', flex: 1, marginRight: 8 },
  resultConfidence: { fontSize: 14, fontWeight: '600', color: '#2b8a3e' },
});
