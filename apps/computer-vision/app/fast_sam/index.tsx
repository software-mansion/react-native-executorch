import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import {
  Canvas,
  Rect,
  Skia,
  useImage,
  type SkImage,
} from '@shopify/react-native-skia';
import {
  useInstanceSegmentation,
  useImageEmbeddings,
  useTextEmbeddings,
  FASTSAM_S,
  FASTSAM_X,
  CLIP_VIT_BASE_PATCH32_IMAGE_QUANTIZED,
  CLIP_VIT_BASE_PATCH32_TEXT,
  InstanceSegmentationModelSources,
  SegmentedInstance,
  FastSAMLabel,
  selectByPoint,
  selectByBox,
  selectByText,
  Bbox,
} from 'react-native-executorch';
import { GeneratingContext } from '../../context';
import { ModelPicker, ModelOption } from '../../components/ModelPicker';
import { BottomBar } from '../../components/BottomBar';
import { StatsBar } from '../../components/StatsBar';
import Spinner from '../../components/Spinner';
import ScreenWrapper from '../../ScreenWrapper';
import ImageWithMasks, {
  buildDisplayInstances,
  DisplayInstance,
} from '../../components/ImageWithMasks';
import { getImage } from '../../utils';
import ColorPalette from '../../colors';

type PromptMode = 'point' | 'box' | 'text';

const MODELS: ModelOption<InstanceSegmentationModelSources>[] = [
  { label: 'FastSAM-S', value: FASTSAM_S },
  { label: 'FastSAM-X', value: FASTSAM_X },
];

export default function SegmentAnythingScreen() {
  const { setGlobalGenerating } = useContext(GeneratingContext);

  const [selectedModel, setSelectedModel] =
    useState<InstanceSegmentationModelSources>(FASTSAM_S);
  const [mode, setMode] = useState<PromptMode>('point');
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);

  const [imageUri, setImageUri] = useState('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const rawInstancesRef = useRef<SegmentedInstance<typeof FastSAMLabel>[]>([]);
  const [selection, setSelection] = useState<DisplayInstance[]>([]);

  const [draftBox, setDraftBox] = useState<Bbox | null>(null);
  const boxStartRef = useRef<{ x: number; y: number } | null>(null);
  const layoutRef = useRef({ width: 0, height: 0 });

  const { isReady, isGenerating, downloadProgress, forward, error } =
    useInstanceSegmentation({ model: selectedModel });

  const clipImage = useImageEmbeddings({
    model: CLIP_VIT_BASE_PATCH32_IMAGE_QUANTIZED,
  });
  const clipText = useTextEmbeddings({ model: CLIP_VIT_BASE_PATCH32_TEXT });
  const skiaSource = useImage(imageUri || null);

  const [textPrompt, setTextPrompt] = useState('');
  const [textBusy, setTextBusy] = useState(false);
  const [embeddingProgress, setEmbeddingProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const instanceEmbeddingsRef = useRef<Float32Array[] | null>(null);

  useEffect(() => {
    setGlobalGenerating(isGenerating);
  }, [isGenerating, setGlobalGenerating]);

  function applyMatch(
    match: SegmentedInstance<typeof FastSAMLabel> | null
  ): void {
    setSelection(match ? buildDisplayInstances([match]) : []);
  }

  function touchToImageCoords(touchX: number, touchY: number) {
    const { width: cw, height: ch } = layoutRef.current;
    const { width: iw, height: ih } = imageSize;
    if (iw === 0 || ih === 0) return null;
    const scale = Math.min(cw / iw, ch / ih);
    return {
      x: (touchX - (cw - iw * scale) / 2) / scale,
      y: (touchY - (ch - ih * scale) / 2) / scale,
    };
  }

  function handleTap(e: GestureResponderEvent) {
    if (mode !== 'point' || rawInstancesRef.current.length === 0) return;
    const c = touchToImageCoords(
      e.nativeEvent.locationX,
      e.nativeEvent.locationY
    );
    if (!c) return;
    applyMatch(
      selectByPoint(rawInstancesRef.current, Math.round(c.x), Math.round(c.y))
    );
  }

  function handleBoxStart(e: GestureResponderEvent) {
    if (mode !== 'box') return;
    const c = touchToImageCoords(
      e.nativeEvent.locationX,
      e.nativeEvent.locationY
    );
    if (!c) return;
    boxStartRef.current = c;
    setDraftBox({ x1: c.x, y1: c.y, x2: c.x, y2: c.y });
  }

  function handleBoxMove(e: GestureResponderEvent) {
    if (mode !== 'box' || !boxStartRef.current) return;
    const c = touchToImageCoords(
      e.nativeEvent.locationX,
      e.nativeEvent.locationY
    );
    if (!c) return;
    const s = boxStartRef.current;
    setDraftBox({
      x1: Math.min(s.x, c.x),
      y1: Math.min(s.y, c.y),
      x2: Math.max(s.x, c.x),
      y2: Math.max(s.y, c.y),
    });
  }

  function handleBoxEnd(e: GestureResponderEvent) {
    if (mode !== 'box' || !boxStartRef.current) return;
    const c = touchToImageCoords(
      e.nativeEvent.locationX,
      e.nativeEvent.locationY
    );
    const s = boxStartRef.current;
    boxStartRef.current = null;
    setDraftBox(null);
    if (!c || rawInstancesRef.current.length === 0) return;
    applyMatch(
      selectByBox(rawInstancesRef.current, {
        x1: Math.min(s.x, c.x),
        y1: Math.min(s.y, c.y),
        x2: Math.max(s.x, c.x),
        y2: Math.max(s.y, c.y),
      })
    );
  }

  async function runTextPrompt() {
    const instances = rawInstancesRef.current;
    if (
      !textPrompt.trim() ||
      instances.length === 0 ||
      !skiaSource ||
      !clipImage.isReady ||
      !clipText.isReady ||
      textBusy
    ) {
      return;
    }
    setTextBusy(true);
    try {
      if (!instanceEmbeddingsRef.current) {
        setEmbeddingProgress({ done: 0, total: instances.length });
        const embeddings: Float32Array[] = [];
        for (let i = 0; i < instances.length; i++) {
          embeddings.push(
            await cropAndEmbed(
              skiaSource,
              instances[i]!.bbox,
              clipImage.forward
            )
          );
          setEmbeddingProgress({ done: i + 1, total: instances.length });
        }
        instanceEmbeddingsRef.current = embeddings;
        setEmbeddingProgress(null);
      }
      const textEmb = await clipText.forward(textPrompt);
      applyMatch(
        selectByText(instances, instanceEmbeddingsRef.current, textEmb)
      );
    } catch (e) {
      console.error(e);
    } finally {
      setTextBusy(false);
    }
  }

  const handleCameraPress = async (isCamera: boolean) => {
    const image = await getImage(isCamera);
    if (!image?.uri) return;
    setImageUri(image.uri);
    setImageSize({ width: image.width ?? 0, height: image.height ?? 0 });
    rawInstancesRef.current = [];
    instanceEmbeddingsRef.current = null;
    setSelection([]);
    setInferenceTime(null);
  };

  const runForward = async () => {
    if (!imageUri) return;
    try {
      const start = Date.now();
      const output = await forward(imageUri, {
        confidenceThreshold: 0.4,
        iouThreshold: 0.9,
        maxInstances: 50,
        returnMaskAtOriginalResolution: true,
      });
      setInferenceTime(Date.now() - start);
      rawInstancesRef.current = output;
      instanceEmbeddingsRef.current = null;
      setSelection([]);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isReady && error) {
    return (
      <ScreenWrapper>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Model</Text>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!isReady) {
    return (
      <Spinner
        visible
        textContent={`Loading the model ${(downloadProgress * 100).toFixed(0)} %`}
      />
    );
  }

  const { width: cw, height: ch } = layoutRef.current;
  const { width: iw, height: ih } = imageSize;
  const drawScale = iw > 0 && ih > 0 ? Math.min(cw / iw, ch / ih) : 1;
  const offsetX = (cw - iw * drawScale) / 2;
  const offsetY = (ch - ih * drawScale) / 2;

  const stepHint = !imageUri
    ? null
    : inferenceTime === null
      ? 'Tap Run to detect instances'
      : rawInstancesRef.current.length === 0
        ? 'No instances detected — try another image'
        : selection.length === 0
          ? 'Tap a point, draw a box, or describe an object'
          : null;

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <View
            style={styles.imageTouchArea}
            onLayout={(e) => {
              layoutRef.current = {
                width: e.nativeEvent.layout.width,
                height: e.nativeEvent.layout.height,
              };
            }}
            onTouchStart={(e) => {
              if (mode === 'point') handleTap(e);
              else if (mode === 'box') handleBoxStart(e);
            }}
            onTouchMove={handleBoxMove}
            onTouchEnd={handleBoxEnd}
          >
            <ImageWithMasks
              imageUri={imageUri}
              instances={selection}
              imageWidth={imageSize.width}
              imageHeight={imageSize.height}
            />
            {draftBox && iw > 0 && (
              <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                <Rect
                  x={draftBox.x1 * drawScale + offsetX}
                  y={draftBox.y1 * drawScale + offsetY}
                  width={(draftBox.x2 - draftBox.x1) * drawScale}
                  height={(draftBox.y2 - draftBox.y1) * drawScale}
                  style="stroke"
                  strokeWidth={2}
                  color="rgba(0,200,255,1)"
                />
              </Canvas>
            )}
          </View>
          {!imageUri && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Segment Anything</Text>
              <Text style={styles.infoText}>
                Segment any object in an image. (1) Pick an image, (2) tap Run
                to detect instances, (3) tap a point, draw a box, or describe an
                object to segment it.
              </Text>
            </View>
          )}
        </View>
      </View>

      {stepHint && <Text style={styles.stepHint}>{stepHint}</Text>}

      <View style={styles.modeRow}>
        {(['point', 'box', 'text'] as PromptMode[]).map((m) => {
          const promptDisabled = rawInstancesRef.current.length === 0;
          return (
            <TouchableOpacity
              key={m}
              style={[
                styles.modeBtn,
                mode === m && styles.modeBtnActive,
                promptDisabled && styles.modeBtnDisabled,
              ]}
              onPress={() => setMode(m)}
              disabled={promptDisabled}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  mode === m && styles.modeBtnTextActive,
                  promptDisabled && styles.modeBtnTextDisabled,
                ]}
              >
                {m[0]!.toUpperCase() + m.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {mode === 'text' && (
        <View style={styles.textRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Describe an object…"
            value={textPrompt}
            onChangeText={setTextPrompt}
            onSubmitEditing={runTextPrompt}
            returnKeyType="search"
            editable={!textBusy}
          />
          <TouchableOpacity
            style={[styles.textBtn, textBusy && styles.textBtnDisabled]}
            onPress={runTextPrompt}
            disabled={
              !textPrompt.trim() ||
              textBusy ||
              rawInstancesRef.current.length === 0 ||
              !clipImage.isReady ||
              !clipText.isReady
            }
          >
            <Text style={styles.textBtnLabel}>{textBusy ? '…' : 'Find'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {mode === 'text' && embeddingProgress && (
        <Text style={styles.statusLine}>
          Embedding instances {embeddingProgress.done}/{embeddingProgress.total}{' '}
          (subsequent text queries are instant)
        </Text>
      )}

      <ModelPicker
        models={MODELS}
        selectedModel={selectedModel}
        disabled={isGenerating}
        onSelect={(m) => {
          setSelectedModel(m);
          rawInstancesRef.current = [];
          instanceEmbeddingsRef.current = null;
          setSelection([]);
          setInferenceTime(null);
        }}
      />

      <StatsBar
        inferenceTime={inferenceTime}
        detectionCount={
          rawInstancesRef.current.length > 0
            ? rawInstancesRef.current.length
            : null
        }
      />

      <BottomBar
        handleCameraPress={handleCameraPress}
        runForward={runForward}
        hasImage={!!imageUri}
        isGenerating={isGenerating}
      />
    </ScreenWrapper>
  );
}

async function cropAndEmbed(
  image: SkImage,
  bbox: Bbox,
  forward: (input: string) => Promise<Float32Array>
): Promise<Float32Array> {
  const w = Math.max(1, Math.round(bbox.x2 - bbox.x1));
  const h = Math.max(1, Math.round(bbox.y2 - bbox.y1));
  const surface = Skia.Surface.MakeOffscreen(w, h);
  if (!surface) throw new Error('Failed to create offscreen Skia surface');
  surface.getCanvas().drawImageRect(
    image,
    {
      x: bbox.x1,
      y: bbox.y1,
      width: bbox.x2 - bbox.x1,
      height: bbox.y2 - bbox.y1,
    },
    { x: 0, y: 0, width: w, height: h },
    Skia.Paint()
  );
  const base64 = surface.makeImageSnapshot().encodeToBase64();
  return forward(`data:image/png;base64,${base64}`);
}

const styles = StyleSheet.create({
  container: { flex: 6, width: '100%' },
  imageContainer: { flex: 1, width: '100%', padding: 16 },
  imageTouchArea: { flex: 1, position: 'relative' },
  infoContainer: { alignItems: 'center', padding: 16, gap: 8 },
  infoTitle: { fontSize: 18, fontWeight: '600', color: 'navy' },
  infoText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  modeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ColorPalette.primary,
    backgroundColor: '#fff',
  },
  modeBtnActive: { backgroundColor: ColorPalette.primary },
  modeBtnDisabled: { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: ColorPalette.primary },
  modeBtnTextActive: { color: '#fff' },
  modeBtnTextDisabled: { color: '#cbd5e1' },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: ColorPalette.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  textBtn: {
    backgroundColor: ColorPalette.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  textBtnDisabled: { backgroundColor: '#cbd5e1' },
  textBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 16 },
  statusLine: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    fontSize: 12,
    color: '#64748b',
  },
  stepHint: {
    paddingHorizontal: 16,
    paddingTop: 6,
    fontSize: 13,
    fontWeight: '500',
    color: ColorPalette.primary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e74c3c',
    marginBottom: 12,
  },
  errorText: { fontSize: 14, color: '#555', textAlign: 'center' },
});
