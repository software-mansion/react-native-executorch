import React, { useContext, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  GestureResponderEvent,
  Image,
} from 'react-native';
import {
  Canvas,
  Image as SkiaImage,
  Rect,
  Group,
  useImage,
  Skia,
  AlphaType,
  ColorType,
} from '@shopify/react-native-skia';
import {
  useInstanceSegmentation,
  FASTSAM_S,
  FASTSAM_X,
  InstanceSegmentationModelSources,
  SegmentedInstance,
  FastSAMLabel,
  selectByPoint,
  selectByBox,
  Bbox,
} from 'react-native-executorch';
import { GeneratingContext } from '../../context';
import { ModelPicker, ModelOption } from '../../components/ModelPicker';
import { BottomBar } from '../../components/BottomBar';
import { StatsBar } from '../../components/StatsBar';
import Spinner from '../../components/Spinner';
import ScreenWrapper from '../../ScreenWrapper';
import { getImage } from '../../utils';
import ColorPalette from '../../colors';

type PromptMode = 'point' | 'box';

const MODELS: ModelOption<InstanceSegmentationModelSources>[] = [
  { label: 'FastSAM-s', value: FASTSAM_S },
  { label: 'FastSAM-x', value: FASTSAM_X },
];

export default function FastSAMScreen() {
  const { setGlobalGenerating } = useContext(GeneratingContext);

  const [selectedModel, setSelectedModel] =
    useState<InstanceSegmentationModelSources>(FASTSAM_S);
  const [mode, setMode] = useState<PromptMode>('point');
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);

  const [imageUri, setImageUri] = useState('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const rawInstancesRef = useRef<SegmentedInstance<typeof FastSAMLabel>[]>([]);
  const [selection, setSelection] = useState<SegmentedInstance<
    typeof FastSAMLabel
  > | null>(null);

  const [draftBox, setDraftBox] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const boxStartRef = useRef<{ x: number; y: number } | null>(null);

  const sourceLayoutRef = useRef({ width: 0, height: 0 });
  const cutoutLayoutRef = useRef({ width: 0, height: 0 });
  const [cutoutLayout, setCutoutLayout] = useState({ width: 0, height: 0 });

  const { isReady, isGenerating, downloadProgress, forward, error } =
    useInstanceSegmentation({ model: selectedModel });

  React.useEffect(() => {
    setGlobalGenerating(isGenerating);
  }, [isGenerating, setGlobalGenerating]);

  // -------------------------------------------------------------------------
  // Coordinate conversion (source image box)
  // -------------------------------------------------------------------------

  function touchToImageCoords(touchX: number, touchY: number) {
    const { width: cw, height: ch } = sourceLayoutRef.current;
    const { width: iw, height: ih } = imageSize;
    if (iw === 0 || ih === 0) return null;
    const scale = Math.min(cw / iw, ch / ih);
    const offsetX = (cw - iw * scale) / 2;
    const offsetY = (ch - ih * scale) / 2;
    return {
      x: (touchX - offsetX) / scale,
      y: (touchY - offsetY) / scale,
    };
  }

  // -------------------------------------------------------------------------
  // Point prompt
  // -------------------------------------------------------------------------

  function handleTap(e: GestureResponderEvent) {
    if (mode !== 'point' || rawInstancesRef.current.length === 0) return;
    const coords = touchToImageCoords(
      e.nativeEvent.locationX,
      e.nativeEvent.locationY
    );
    if (!coords) return;
    const t0 = Date.now();
    const match = selectByPoint(
      rawInstancesRef.current,
      Math.round(coords.x),
      Math.round(coords.y)
    );
    console.log(`[FastSAM] selectByPoint(): ${Date.now() - t0}ms`);
    setSelection(match ?? null);
  }

  // -------------------------------------------------------------------------
  // Box prompt
  // -------------------------------------------------------------------------

  function handleBoxStart(e: GestureResponderEvent) {
    if (mode !== 'box') return;
    const coords = touchToImageCoords(
      e.nativeEvent.locationX,
      e.nativeEvent.locationY
    );
    if (!coords) return;
    boxStartRef.current = coords;
    setDraftBox({ x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y });
  }

  function handleBoxMove(e: GestureResponderEvent) {
    if (mode !== 'box' || !boxStartRef.current) return;
    const coords = touchToImageCoords(
      e.nativeEvent.locationX,
      e.nativeEvent.locationY
    );
    if (!coords) return;
    const s = boxStartRef.current;
    setDraftBox({
      x1: Math.min(s.x, coords.x),
      y1: Math.min(s.y, coords.y),
      x2: Math.max(s.x, coords.x),
      y2: Math.max(s.y, coords.y),
    });
  }

  function handleBoxEnd(e: GestureResponderEvent) {
    if (
      mode !== 'box' ||
      !boxStartRef.current ||
      rawInstancesRef.current.length === 0
    ) {
      boxStartRef.current = null;
      setDraftBox(null);
      return;
    }
    const coords = touchToImageCoords(
      e.nativeEvent.locationX,
      e.nativeEvent.locationY
    );
    const s = boxStartRef.current;
    boxStartRef.current = null;
    setDraftBox(null);
    if (!coords) return;
    const box: Bbox = {
      x1: Math.min(s.x, coords.x),
      y1: Math.min(s.y, coords.y),
      x2: Math.max(s.x, coords.x),
      y2: Math.max(s.y, coords.y),
    };
    const t0 = Date.now();
    const match = selectByBox(rawInstancesRef.current, box);
    console.log(`[FastSAM] selectByBox(): ${Date.now() - t0}ms`);
    setSelection(match ?? null);
  }

  // -------------------------------------------------------------------------
  // Image loading & inference
  // -------------------------------------------------------------------------

  const handleCameraPress = async (isCamera: boolean) => {
    const image = await getImage(isCamera);
    if (!image?.uri) return;
    setImageUri(image.uri);
    setImageSize({ width: image.width ?? 0, height: image.height ?? 0 });
    rawInstancesRef.current = [];
    setSelection(null);
    setInferenceTime(null);
  };

  const runForward = async () => {
    if (!imageUri) return;
    try {
      const t0 = Date.now();
      const output = await forward(imageUri, {
        confidenceThreshold: 0.4,
        iouThreshold: 0.9,
        maxInstances: 50,
        returnMaskAtOriginalResolution: true,
      });
      const inferenceMs = Date.now() - t0;
      console.log(
        `[FastSAM] forward(): ${inferenceMs}ms, instances: ${output.length}`
      );
      setInferenceTime(inferenceMs);
      rawInstancesRef.current = output;
      setSelection(null);
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------------------
  // Cutout rendering
  // -------------------------------------------------------------------------

  const skiaSource = useImage(imageUri || null);

  const alphaMask = useMemo(() => {
    if (!selection) return null;
    const t0 = Date.now();
    const mask = buildAlphaMask(
      selection.mask,
      selection.maskWidth,
      selection.maskHeight,
      selection.bbox.x1,
      selection.bbox.y1,
      imageSize.width,
      imageSize.height
    );
    console.log(`[FastSAM] buildAlphaMask(): ${Date.now() - t0}ms`);
    return mask;
  }, [selection, imageSize]);

  const { width: cw, height: ch } = cutoutLayout;
  const { width: iw, height: ih } = imageSize;
  const cutoutScale =
    cw > 0 && ch > 0 && iw > 0 && ih > 0 ? Math.min(cw / iw, ch / ih) : 1;
  const cutoutOffsetX = (cw - iw * cutoutScale) / 2;
  const cutoutOffsetY = (ch - ih * cutoutScale) / 2;

  // Draft box overlay coords (source box)
  const { width: scw, height: sch } = sourceLayoutRef.current;
  const srcScale = iw > 0 && ih > 0 ? Math.min(scw / iw, sch / ih) : 1;
  const srcOffsetX = (scw - iw * srcScale) / 2;
  const srcOffsetY = (sch - ih * srcScale) / 2;

  // -------------------------------------------------------------------------
  // Error / loading
  // -------------------------------------------------------------------------

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
        textContent={`Loading model ${(downloadProgress * 100).toFixed(0)}%`}
      />
    );
  }

  return (
    <ScreenWrapper>
      {/* ---- Source image box ---- */}
      <View
        style={styles.imageBox}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          sourceLayoutRef.current = { width, height };
        }}
        onTouchStart={(e) => {
          if (mode === 'point') handleTap(e);
          else handleBoxStart(e);
        }}
        onTouchMove={(e) => {
          if (mode === 'box') handleBoxMove(e);
        }}
        onTouchEnd={(e) => {
          if (mode === 'box') handleBoxEnd(e);
        }}
      >
        <Image
          style={styles.image}
          resizeMode="contain"
          source={
            imageUri
              ? { uri: imageUri }
              : require('../../assets/icons/executorch_logo.png')
          }
        />
        {!imageUri && (
          <View style={styles.hint}>
            <Text style={styles.hintText}>Load an image to get started</Text>
          </View>
        )}
        {/* Draft box */}
        {draftBox && iw > 0 && (
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            <Rect
              x={draftBox.x1 * srcScale + srcOffsetX}
              y={draftBox.y1 * srcScale + srcOffsetY}
              width={(draftBox.x2 - draftBox.x1) * srcScale}
              height={(draftBox.y2 - draftBox.y1) * srcScale}
              style="stroke"
              strokeWidth={2}
              color="rgba(0,200,255,1)"
            />
          </Canvas>
        )}
      </View>

      {/* ---- Cutout box ---- */}
      <View
        style={styles.imageBox}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          cutoutLayoutRef.current = { width, height };
          setCutoutLayout({ width, height });
        }}
      >
        {selection && skiaSource && alphaMask ? (
          <Canvas style={StyleSheet.absoluteFill}>
            <Rect x={0} y={0} width={cw} height={ch} color="black" />
            <Group layer>
              <SkiaImage
                image={skiaSource}
                x={cutoutOffsetX}
                y={cutoutOffsetY}
                width={iw * cutoutScale}
                height={ih * cutoutScale}
                fit="fill"
              />
              <SkiaImage
                image={alphaMask}
                x={cutoutOffsetX}
                y={cutoutOffsetY}
                width={iw * cutoutScale}
                height={ih * cutoutScale}
                fit="fill"
                blendMode="dstIn"
              />
            </Group>
          </Canvas>
        ) : (
          <View style={styles.hint}>
            <Text style={styles.hintText}>
              {rawInstancesRef.current.length > 0
                ? 'Tap or draw a box on the image above'
                : imageUri
                  ? 'Run inference first'
                  : ''}
            </Text>
          </View>
        )}
      </View>

      {/* ---- Controls ---- */}
      <View style={styles.controls}>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'point' && styles.modeBtnActive]}
            onPress={() => setMode('point')}
          >
            <Text
              style={[
                styles.modeBtnText,
                mode === 'point' && styles.modeBtnTextActive,
              ]}
            >
              Point
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'box' && styles.modeBtnActive]}
            onPress={() => setMode('box')}
          >
            <Text
              style={[
                styles.modeBtnText,
                mode === 'box' && styles.modeBtnTextActive,
              ]}
            >
              Box
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ModelPicker
        models={MODELS}
        selectedModel={selectedModel}
        disabled={isGenerating}
        onSelect={(m) => {
          setSelectedModel(m);
          rawInstancesRef.current = [];
          setSelection(null);
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Builds a full-image alpha mask. `mask` is bbox-relative (maskWidth × maskHeight),
// positioned at (bboxX1, bboxY1) within an image of size (imgW × imgH).
function buildAlphaMask(
  mask: Uint8Array,
  maskWidth: number,
  maskHeight: number,
  bboxX1: number,
  bboxY1: number,
  imgW: number,
  imgH: number
) {
  const MAX_DIM = 256;
  const ds = Math.min(1, MAX_DIM / Math.max(imgW, imgH));
  const dstW = Math.max(1, Math.round(imgW * ds));
  const dstH = Math.max(1, Math.round(imgH * ds));

  const pixels = new Uint8Array(dstW * dstH * 4);

  // Place the bbox-relative mask into the full-image canvas
  const offX = Math.round(bboxX1 * ds);
  const offY = Math.round(bboxY1 * ds);
  const scaledMaskW = Math.max(1, Math.round(maskWidth * ds));
  const scaledMaskH = Math.max(1, Math.round(maskHeight * ds));

  for (let dy = 0; dy < scaledMaskH; dy++) {
    const sy = Math.min(
      Math.floor((dy / scaledMaskH) * maskHeight),
      maskHeight - 1
    );
    for (let dx = 0; dx < scaledMaskW; dx++) {
      const sx = Math.min(
        Math.floor((dx / scaledMaskW) * maskWidth),
        maskWidth - 1
      );
      if (mask[sy * maskWidth + sx] > 0) {
        const imgX = offX + dx;
        const imgY = offY + dy;
        if (imgX >= 0 && imgX < dstW && imgY >= 0 && imgY < dstH) {
          const i = (imgY * dstW + imgX) * 4;
          pixels[i] = 255;
          pixels[i + 1] = 255;
          pixels[i + 2] = 255;
          pixels[i + 3] = 255;
        }
      }
    }
  }

  const data = Skia.Data.fromBytes(pixels);
  const img = Skia.Image.MakeImage(
    {
      width: dstW,
      height: dstH,
      alphaType: AlphaType.Premul,
      colorType: ColorType.RGBA_8888,
    },
    data,
    dstW * 4
  );
  data.dispose();
  return img;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  imageBox: {
    flex: 1,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hint: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#aaa',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ColorPalette.primary,
  },
  modeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  modeBtnActive: {
    backgroundColor: ColorPalette.primary,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: ColorPalette.primary,
  },
  modeBtnTextActive: {
    color: '#fff',
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
  errorText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
});
