import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Platform } from 'react-native';
import { commonStyles, ColorPalette } from '../../theme';
import { useImage, Skia, ColorType, AlphaType, type SkImage } from '@shopify/react-native-skia';
import { useDocumentOCR, models } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getImage } from '../../utils';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';
import { ImageViewport } from '../../components/ImageViewport';
import { ModelStatus } from '../../components/ModelStatus';
import { Button } from '../../components/Button';

const PREVIEW_HEIGHT = 280;

// Hosted per-backend model triplets (OCR + layout + supporting) — downloaded +
// cached on-device from Hugging Face by `useDocumentOCR`. Backends are filtered
// by platform (Vulkan = Android, CoreML = iOS, XNNPACK = both).
type BackendKey = 'XNNPACK' | 'VULKAN' | 'COREML';
const BACKENDS: { key: BackendKey; label: string; platforms: string[] }[] = [
  { key: 'XNNPACK', label: 'XNNPACK (CPU)', platforms: ['ios', 'android'] },
  { key: 'VULKAN', label: 'Vulkan (GPU)', platforms: ['android'] },
  { key: 'COREML', label: 'CoreML (ANE)', platforms: ['ios'] },
];
const AVAILABLE = BACKENDS.filter((b) => b.platforms.includes(Platform.OS));
const BACKEND_OPTIONS: ModelOption[] = AVAILABLE.map((b, i) => ({ label: b.label, value: i }));

type Cell = { text: string; colspan: number; rowspan: number };
type DocBlock = {
  regionType: string;
  text: string;
  isTable: boolean;
  tableHtml?: string;
  bbox: { xmin: number; ymin: number; xmax: number; ymax: number };
};

// Parse the SLANet structure HTML (filled) into rows of cells for rendering.
function parseTable(html: string): Cell[][] {
  const rows: Cell[][] = [];
  const trRe = /<tr>([\s\S]*?)<\/tr>/g;
  let tr: RegExpExecArray | null;
  while ((tr = trRe.exec(html))) {
    const cells: Cell[] = [];
    const tdRe = /<td([^>]*)>([\s\S]*?)<\/td>/g;
    let td: RegExpExecArray | null;
    while ((td = tdRe.exec(tr[1]!))) {
      const attrs = td[1] ?? '';
      cells.push({
        text: td[2] ?? '',
        colspan: Number(/colspan="(\d+)"/.exec(attrs)?.[1] ?? 1),
        rowspan: Number(/rowspan="(\d+)"/.exec(attrs)?.[1] ?? 1),
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
  // Fixed-width cells inside a horizontal scroll — wide tables scroll instead of
  // squishing every column into the screen width.
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

function DocumentContent() {
  const [backendIdx, setBackendIdx] = useState(0);
  const [layoutOn, setLayoutOn] = useState(true);
  const [supportingOn, setSupportingOn] = useState(true);
  const [orientation, setOrientation] = useState(true);
  // Off by default: dewarp (UVDoc) corrects photographed, physically-warped pages;
  // on a flat screenshot it has nothing to fix and visibly distorts clean text.
  const [dewarp, setDewarp] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [blocks, setBlocks] = useState<DocBlock[]>([]);
  // The frame the result boxes are relative to (orientation/dewarp may move it
  // away from the original), so the overlay lines up.
  const [processed, setProcessed] = useState<SkImage | null>(null);
  const [wallMs, setWallMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const backend = AVAILABLE[backendIdx]!;

  const skiaImage = useImage(imageUri, (err) => setError(err.message || String(err)));

  // Hosted configs — `useDocumentOCR` downloads + caches each enabled model.
  const config = {
    ocr: models.ocr.PADDLE.PPOCRV6_SMALL[backend.key],
    ...(layoutOn ? { layout: models.layoutDetection.PP_DOCLAYOUT[backend.key] } : {}),
    ...(supportingOn ? { supporting: models.supporting.PP_SUPPORTING[backend.key] } : {}),
    orientation,
    dewarp,
  };

  const { isReady, downloadProgress, error: loadError, runDocumentOCR } = useDocumentOCR(config);

  const handlePick = async (useCamera: boolean) => {
    setError(null);
    try {
      const uri = await getImage(useCamera);
      if (uri) {
        setImageUri(uri);
        setBlocks([]);
        setProcessed(null);
        setWallMs(null);
      }
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const run = async () => {
    if (!skiaImage || !runDocumentOCR) return;
    setIsProcessing(true);
    setError(null);
    try {
      const pixels = skiaImage.readPixels();
      if (!(pixels instanceof Uint8Array)) throw new Error('Expected Uint8Array from readPixels');
      const start = Date.now();
      const out = await runDocumentOCR({
        data: pixels,
        width: skiaImage.width(),
        height: skiaImage.height(),
        format: 'rgba' as const,
        layout: 'hwc' as const,
      });
      setWallMs(Date.now() - start);
      setBlocks(out.blocks as DocBlock[]);
      // Show the frame the boxes are relative to (orientation/dewarp may have
      // rotated/warped it), so the overlaid boxes align.
      const frame = out.image;
      const skData = Skia.Data.fromBytes(frame.data);
      const frameImage = Skia.Image.MakeImage(
        {
          width: frame.width,
          height: frame.height,
          colorType: ColorType.RGBA_8888,
          alphaType: AlphaType.Unpremul,
        },
        skData,
        frame.width * 4
      );
      setProcessed(frameImage);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setIsProcessing(false);
    }
  };

  const activeError = loadError ? String(loadError) : error;
  const boxes = blocks.map((b) => [
    { x: b.bbox.xmin, y: b.bbox.ymin },
    { x: b.bbox.xmax, y: b.bbox.ymin },
    { x: b.bbox.xmax, y: b.bbox.ymax },
    { x: b.bbox.xmin, y: b.bbox.ymax },
  ]);

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={commonStyles.contentContainer}
    >
      <Text style={commonStyles.description}>
        Full document pipeline: layout → OCR grouped into reading-ordered blocks, with orientation,
        table-structure recognition and (optional) dewarp. PaddleOCR is always on; dewarp is off by
        default — it only helps photographed, warped pages (toggling reloads the models).
      </Text>

      <ModelPicker
        label="Backend"
        options={BACKEND_OPTIONS}
        selectedValue={backendIdx}
        onValueChange={(v) => {
          setBackendIdx(v);
          setBlocks([]);
          setProcessed(null);
          setWallMs(null);
        }}
      />

      <Toggle label="Layout (blocks)" value={layoutOn} onChange={setLayoutOn} />
      <Toggle label="Tables" value={supportingOn} onChange={setSupportingOn} />
      <Toggle
        label="Correct orientation"
        value={orientation}
        onChange={setOrientation}
        hint="needs Tables on"
      />
      <Toggle label="Dewarp" value={dewarp} onChange={setDewarp} hint="needs Tables on" />

      <ModelStatus
        isReady={isReady}
        downloadProgress={downloadProgress}
        error={activeError}
        modelTypeLabel="document pipeline"
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
          title="Run pipeline"
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
              <Text style={styles.tileValue}>{blocks.length}</Text>
              <Text style={styles.tileLabel}>Blocks</Text>
            </View>
          </View>
        </View>
      )}

      {blocks.length > 0 && (
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
      )}
    </ScrollView>
  );
}

function Toggle({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint ? <Text style={styles.toggleHint}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

export default function DocumentScreen() {
  return (
    <ScreenWrapper>
      <DocumentContent />
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
  statTiles: { flexDirection: 'row', gap: 12 },
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
  results: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 12,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ColorPalette.strongPrimary,
    marginBottom: 12,
  },
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
