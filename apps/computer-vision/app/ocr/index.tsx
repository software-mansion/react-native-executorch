import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Switch } from 'react-native';
import { commonStyles, ColorPalette } from '../../theme';
import { useImage, Skia, ColorType, AlphaType, type SkImage } from '@shopify/react-native-skia';
import {
  useOcr,
  models,
  type OcrDetection,
  type DocumentBlock,
  type OcrModel,
} from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getImage } from '../../utils';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';
import { ImageViewport } from '../../components/ImageViewport';
import { ModelStatus } from '../../components/ModelStatus';
import { Button } from '../../components/Button';

const PREVIEW_HEIGHT = 280;

type BackendKey = 'XNNPACK' | 'VULKAN' | 'COREML';
const ALL_MODELS: { label: string; backend: BackendKey; base: OcrModel; platforms: string[] }[] = [
  {
    label: 'PaddleOCR (XNNPACK)',
    backend: 'XNNPACK',
    base: models.ocr.PADDLE.PPOCRV6_SMALL.XNNPACK,
    platforms: ['ios', 'android'],
  },
  {
    label: 'PaddleOCR (Vulkan)',
    backend: 'VULKAN',
    base: models.ocr.PADDLE.PPOCRV6_SMALL.VULKAN,
    platforms: ['android'],
  },
  {
    label: 'PaddleOCR (CoreML)',
    backend: 'COREML',
    base: models.ocr.PADDLE.PPOCRV6_SMALL.COREML,
    platforms: ['ios'],
  },
  {
    label: 'EasyOCR English (XNNPACK)',
    backend: 'XNNPACK',
    base: models.ocr.EASYOCR.ENGLISH.XNNPACK,
    platforms: ['ios', 'android'],
  },
  {
    label: 'EasyOCR English (Vulkan)',
    backend: 'VULKAN',
    base: models.ocr.EASYOCR.ENGLISH.VULKAN,
    platforms: ['android'],
  },
  {
    label: 'EasyOCR English (CoreML)',
    backend: 'COREML',
    base: models.ocr.EASYOCR.ENGLISH.COREML,
    platforms: ['ios'],
  },
];

const OCR_MODELS = ALL_MODELS.filter((m) => m.platforms.includes(Platform.OS));
const MODEL_OPTIONS: ModelOption[] = OCR_MODELS.map((m, i) => ({ label: m.label, value: i }));

type Cell = { text: string; colspan: number };

// Parse the filled SLANet structure HTML into rows of cells for rendering.
function parseTable(html: string): Cell[][] {
  const rows: Cell[][] = [];
  const trRe = /<tr>([\s\S]*?)<\/tr>/g;
  let tr: RegExpExecArray | null;
  while ((tr = trRe.exec(html))) {
    const cells: Cell[] = [];
    const tdRe = /<td([^>]*)>([\s\S]*?)<\/td>/g;
    let td: RegExpExecArray | null;
    while ((td = tdRe.exec(tr[1]!))) {
      cells.push({
        text: td[2] ?? '',
        colspan: Number(/colspan="(\d+)"/.exec(td[1] ?? '')?.[1] ?? 1),
      });
    }
    rows.push(cells);
  }
  return rows;
}

function TableView({ html }: { html: string }) {
  const rows = parseTable(html);
  if (rows.length === 0) {
    return <Text style={styles.blockText}>{html}</Text>;
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.table}>
        {rows.map((cells, r) => (
          <View key={r} style={styles.tr}>
            {cells.map((c, i) => (
              <View key={i} style={[styles.td, { width: 110 * c.colspan }]}>
                <Text style={styles.tdText}>{c.text}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function OCRContent() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [vertical, setVertical] = useState(false);
  const [layoutOn, setLayoutOn] = useState(false);
  const [documentOn, setDocumentOn] = useState(false);
  const [orientation, setOrientation] = useState(true);
  const [tables, setTables] = useState(true);
  const [dewarp, setDewarp] = useState(false); // off: only helps warped photos
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detections, setDetections] = useState<OcrDetection[]>([]);
  const [blocks, setBlocks] = useState<DocumentBlock<string>[]>([]);
  // The corrected frame the result boxes are relative to (for the overlay).
  const [processed, setProcessed] = useState<SkImage | null>(null);
  const [wallMs, setWallMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = OCR_MODELS[selectedIdx]!;
  const skiaImage = useImage(imageUri, (err) => setError(err.message || String(err)));

  const config = {
    ...selected.base,
    ...(layoutOn ? { layout: models.layoutDetection.PP_DOCLAYOUT[selected.backend] } : {}),
    ...(documentOn ? { documentModels: models.documentModels.PP_HELPERS[selected.backend] } : {}),
  };

  const { isReady, downloadProgress, error: loadError, runOcr } = useOcr<string>(config);

  const resetResults = () => {
    setDetections([]);
    setBlocks([]);
    setProcessed(null);
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
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const run = async () => {
    if (!skiaImage || !runOcr) return;
    setIsProcessing(true);
    setError(null);
    try {
      const pixels = skiaImage.readPixels();
      if (!(pixels instanceof Uint8Array)) throw new Error('Expected Uint8Array from readPixels');
      const start = Date.now();
      const out = await runOcr(
        {
          data: pixels,
          width: skiaImage.width(),
          height: skiaImage.height(),
          format: 'rgba' as const,
          layout: 'hwc' as const,
        },
        {
          vertical,
          orientation: documentOn && orientation,
          dewarp: documentOn && dewarp,
          tables: documentOn && tables,
        }
      );
      setWallMs(Date.now() - start);
      setDetections(out.detections);
      setBlocks(out.blocks);
      const frame = out.image;
      const frameImage = Skia.Image.MakeImage(
        {
          width: frame.width,
          height: frame.height,
          colorType: ColorType.RGBA_8888,
          alphaType: AlphaType.Premul,
        },
        Skia.Data.fromBytes(frame.data),
        frame.width * 4
      );
      setProcessed(frameImage ?? null);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setIsProcessing(false);
    }
  };

  const activeError = loadError ? String(loadError) : error;
  const boxes = useMemo(() => detections.map((d) => d.quad), [detections]);
  const showBlocks = layoutOn && blocks.length > 0;

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={commonStyles.contentContainer}
    >
      <Text style={commonStyles.description}>
        Detect and recognize text on-device. Turn on Layout to group text into reading-ordered
        blocks, and Document helpers for orientation, table structure and dewarp.
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

      <Toggle
        label="Vertical text"
        value={vertical}
        onChange={setVertical}
        hint="read upright stacked columns"
      />
      <Toggle
        label="Layout (blocks)"
        value={layoutOn}
        onChange={setLayoutOn}
        hint="group into reading-ordered regions"
      />
      <Toggle
        label="Document helpers"
        value={documentOn}
        onChange={setDocumentOn}
        hint="orientation, table structure, dewarp"
      />
      {documentOn && (
        <>
          <Toggle
            label="Correct orientation"
            value={orientation}
            onChange={setOrientation}
            indent
          />
          <Toggle
            label="Table structure"
            value={tables}
            onChange={setTables}
            indent
            hint="needs Layout on"
          />
          <Toggle
            label="Dewarp"
            value={dewarp}
            onChange={setDewarp}
            indent
            hint="warped photos only"
          />
        </>
      )}

      <ModelStatus
        isReady={isReady}
        downloadProgress={downloadProgress}
        error={activeError}
        modelTypeLabel="OCR model"
      />

      <ImageViewport
        skiaImage={processed ?? skiaImage}
        height={PREVIEW_HEIGHT}
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
              <Text style={styles.tileValue}>{showBlocks ? blocks.length : detections.length}</Text>
              <Text style={styles.tileLabel}>{showBlocks ? 'Blocks' : 'Regions read'}</Text>
            </View>
          </View>
        </View>
      )}

      {showBlocks ? (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>Blocks ({blocks.length})</Text>
          {blocks.map((b, i) => (
            <View key={i} style={styles.block}>
              <Text style={styles.regionType}>
                {b.regionType}
                {b.isTable ? '  · table' : ''}
              </Text>
              {b.isTable && b.tableHtml ? (
                <TableView html={b.tableHtml} />
              ) : (
                <Text style={styles.blockText}>{b.text}</Text>
              )}
            </View>
          ))}
        </View>
      ) : detections.length > 0 ? (
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
      ) : null}
    </ScrollView>
  );
}

function Toggle({
  label,
  value,
  onChange,
  hint,
  indent,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
  indent?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, indent && styles.toggleIndent]}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint ? <Text style={styles.toggleHint}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
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
    marginBottom: 8,
  },
  toggleIndent: { paddingLeft: 16 },
  toggleText: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: ColorPalette.strongPrimary },
  toggleHint: { fontSize: 12, color: '#868e96', marginTop: 2 },
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
  block: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  regionType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2b8a3e',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  blockText: { fontSize: 14, color: '#333' },
  table: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 4, overflow: 'hidden' },
  tr: { flexDirection: 'row' },
  td: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ced4da',
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 24,
  },
  tdText: { fontSize: 13, color: '#333' },
});
