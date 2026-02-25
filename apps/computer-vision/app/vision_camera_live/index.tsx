import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  Frame,
  getCameraFormat,
  Templates,
  useCameraDevices,
  useCameraPermission,
  useFrameOutput,
} from 'react-native-vision-camera';
import { createSynchronizable, runOnJS } from 'react-native-worklets';
import {
  DEEPLAB_V3_RESNET50,
  Detection,
  EFFICIENTNET_V2_S,
  OCRDetection,
  OCR_ENGLISH,
  SSDLITE_320_MOBILENET_V3_LARGE,
  STYLE_TRANSFER_RAIN_PRINCESS,
  useClassification,
  useImageSegmentation,
  useObjectDetection,
  useOCR,
  useStyleTransfer,
} from 'react-native-executorch';
import {
  AlphaType,
  Canvas,
  ColorType,
  Image as SkiaImage,
  matchFont,
  Path,
  Skia,
  SkImage,
  Text as SkiaText,
} from '@shopify/react-native-skia';
import { GeneratingContext } from '../../context';
import Spinner from '../../components/Spinner';
import ColorPalette from '../../colors';

// ─── Model IDs ───────────────────────────────────────────────────────────────

type ModelId =
  | 'classification'
  | 'object_detection'
  | 'segmentation'
  | 'style_transfer'
  | 'ocr';

const MODELS: { id: ModelId; label: string }[] = [
  { id: 'classification', label: 'Classification' },
  { id: 'object_detection', label: 'Object Detection' },
  { id: 'segmentation', label: 'Segmentation' },
  { id: 'style_transfer', label: 'Style Transfer' },
  { id: 'ocr', label: 'OCR' },
];

// ─── Segmentation colors ─────────────────────────────────────────────────────

const CLASS_COLORS: number[][] = [
  [0, 0, 0, 0],
  [51, 255, 87, 180],
  [51, 87, 255, 180],
  [255, 51, 246, 180],
  [51, 255, 246, 180],
  [243, 255, 51, 180],
  [141, 51, 255, 180],
  [255, 131, 51, 180],
  [51, 255, 131, 180],
  [131, 51, 255, 180],
  [255, 255, 51, 180],
  [51, 255, 255, 180],
  [255, 51, 143, 180],
  [127, 51, 255, 180],
  [51, 255, 175, 180],
  [255, 175, 51, 180],
  [179, 255, 51, 180],
  [255, 87, 51, 180],
  [255, 51, 162, 180],
  [51, 162, 255, 180],
  [162, 51, 255, 180],
];

// ─── Kill switch — synchronizable boolean shared between JS and worklet thread.
// setBlocking(true) immediately stops the worklet from dispatching new work
// (both in onFrame and inside the async callback) before the old model tears down.
const frameKillSwitch = createSynchronizable(false);

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function VisionCameraLiveScreen() {
  const insets = useSafeAreaInsets();
  const [activeModel, setActiveModel] = useState<ModelId>('classification');
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const { setGlobalGenerating } = useContext(GeneratingContext);

  // ── Models (only the active model loads; others are prevented) ──
  const classification = useClassification({
    model: EFFICIENTNET_V2_S,
    preventLoad: activeModel !== 'classification',
  });
  const objectDetection = useObjectDetection({
    model: SSDLITE_320_MOBILENET_V3_LARGE,
    preventLoad: activeModel !== 'object_detection',
  });
  const segmentation = useImageSegmentation({
    model: DEEPLAB_V3_RESNET50,
    preventLoad: activeModel !== 'segmentation',
  });
  const styleTransfer = useStyleTransfer({
    model: STYLE_TRANSFER_RAIN_PRINCESS,
    preventLoad: activeModel !== 'style_transfer',
  });
  const ocr = useOCR({
    model: OCR_ENGLISH,
    preventLoad: activeModel !== 'ocr',
  });

  const activeIsGenerating = {
    classification: classification.isGenerating,
    object_detection: objectDetection.isGenerating,
    segmentation: segmentation.isGenerating,
    style_transfer: styleTransfer.isGenerating,
    ocr: ocr.isGenerating,
  }[activeModel];

  useEffect(() => {
    setGlobalGenerating(activeIsGenerating);
  }, [activeIsGenerating, setGlobalGenerating]);

  // ── Camera ──
  const [fps, setFps] = useState(0);
  const lastFrameTimeRef = useRef(Date.now());
  const cameraPermission = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back') ?? devices[0];
  const format = useMemo(() => {
    if (device == null) return undefined;
    try {
      return getCameraFormat(device, Templates.FrameProcessing);
    } catch {
      return undefined;
    }
  }, [device]);

  // ── Per-model result state ──
  const [classResult, setClassResult] = useState({ label: '', score: 0 });
  const [detections, setDetections] = useState<Detection[]>([]);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [maskImage, setMaskImage] = useState<SkImage | null>(null);
  const [styledImage, setStyledImage] = useState<SkImage | null>(null);
  const [ocrData, setOcrData] = useState<{
    detections: OCRDetection[];
    frameWidth: number;
    frameHeight: number;
  }>({ detections: [], frameWidth: 1, frameHeight: 1 });

  // ── Stable callbacks ──
  function tick() {
    const now = Date.now();
    const diff = now - lastFrameTimeRef.current;
    if (diff > 0) setFps(Math.round(1000 / diff));
    lastFrameTimeRef.current = now;
  }

  const updateClass = useCallback((r: { label: string; score: number }) => {
    setClassResult(r);
    tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateDetections = useCallback(
    (p: { results: Detection[]; imageWidth: number; imageHeight: number }) => {
      setDetections(p.results);
      setImageSize({ width: p.imageWidth, height: p.imageHeight });
      tick();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const updateMask = useCallback((img: SkImage) => {
    setMaskImage((prev) => {
      prev?.dispose();
      return img;
    });
    tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStyled = useCallback((img: SkImage) => {
    setStyledImage((prev) => {
      prev?.dispose();
      return img;
    });
    tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateOcr = useCallback(
    (d: {
      detections: OCRDetection[];
      frameWidth: number;
      frameHeight: number;
    }) => {
      setOcrData(d);
      tick();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── runOnJS-wrapped callbacks — created on the RN thread so the Babel plugin
  // can serialize them into remote functions. These can then be safely called
  // from any worklet runtime, including the asyncRunner's worker runtime.
  const notifyClass = runOnJS(updateClass);
  const notifyDetections = runOnJS(updateDetections);
  const notifyMask = runOnJS(updateMask);
  const notifyStyled = runOnJS(updateStyled);
  const notifyOcr = runOnJS(updateOcr);

  // ── Pull the active model's runOnFrame out of the hook each render.
  // These are worklet functions (not plain JS objects), so they CAN be
  // captured directly in a useCallback closure — the worklets runtime
  // serializes them correctly. A new closure is produced whenever the
  // active runOnFrame changes, causing useFrameOutput to re-register.
  const classRof = classification.runOnFrame;
  const detRof = objectDetection.runOnFrame;
  const segRof = segmentation.runOnFrame;
  const stRof = styleTransfer.runOnFrame;
  const ocrRof = ocr.runOnFrame;

  // When switching models: activate kill switch synchronously so the worklet
  // thread stops calling runOnFrame before delete() fires on the old model.
  // Then re-enable once the new model's preventLoad has taken effect.
  useEffect(() => {
    frameKillSwitch.setBlocking(true);
    setMaskImage((prev) => {
      prev?.dispose();
      return null;
    });
    setStyledImage((prev) => {
      prev?.dispose();
      return null;
    });
    const id = setTimeout(() => {
      frameKillSwitch.setBlocking(false);
    }, 300);
    return () => clearTimeout(id);
  }, [activeModel]);

  // ── Single frame output.
  // onFrame is re-created (and re-registered by useFrameOutput) whenever the
  // active model or its runOnFrame worklet changes. The kill switch provides
  // synchronous cross-thread protection during the transition window.
  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    onFrame: useCallback(
      (frame: Frame) => {
        'worklet';

        // Kill switch is set synchronously from JS when switching models —
        // guaranteed visible here before the next frame is dispatched.
        if (frameKillSwitch.getDirty()) {
          frame.dispose();
          return;
        }

        try {
          if (activeModel === 'classification') {
            if (!classRof) return;
            const result = classRof(frame);
            if (result) {
              let bestLabel = '';
              let bestScore = -1;
              const entries = Object.entries(result);
              for (let i = 0; i < entries.length; i++) {
                const [label, score] = entries[i]!;
                if ((score as number) > bestScore) {
                  bestScore = score as number;
                  bestLabel = label;
                }
              }
              notifyClass({
                label: bestLabel,
                score: bestScore,
              });
            }
          } else if (activeModel === 'object_detection') {
            if (!detRof) return;
            const iw = frame.width > frame.height ? frame.height : frame.width;
            const ih = frame.width > frame.height ? frame.width : frame.height;
            const result = detRof(frame, 0.5);
            if (result) {
              notifyDetections({
                results: result,
                imageWidth: iw,
                imageHeight: ih,
              });
            }
          } else if (activeModel === 'segmentation') {
            if (!segRof) return;
            const result = segRof(frame, [], false);
            if (result?.ARGMAX) {
              const argmax: Int32Array = result.ARGMAX;
              const side = Math.round(Math.sqrt(argmax.length));
              const pixels = new Uint8Array(side * side * 4);
              for (let i = 0; i < argmax.length; i++) {
                const color = CLASS_COLORS[argmax[i]!] ?? [0, 0, 0, 0];
                pixels[i * 4] = color[0]!;
                pixels[i * 4 + 1] = color[1]!;
                pixels[i * 4 + 2] = color[2]!;
                pixels[i * 4 + 3] = color[3]!;
              }
              const skData = Skia.Data.fromBytes(pixels);
              const img = Skia.Image.MakeImage(
                {
                  width: side,
                  height: side,
                  alphaType: AlphaType.Unpremul,
                  colorType: ColorType.RGBA_8888,
                },
                skData,
                side * 4
              );
              if (img) notifyMask(img);
            }
          } else if (activeModel === 'style_transfer') {
            if (!stRof) return;
            const result = stRof(frame);
            if (result?.dataPtr) {
              const { dataPtr, sizes } = result;
              const h = sizes[0]!;
              const w = sizes[1]!;
              const skData = Skia.Data.fromBytes(dataPtr);
              const img = Skia.Image.MakeImage(
                {
                  width: w,
                  height: h,
                  alphaType: AlphaType.Opaque,
                  colorType: ColorType.RGBA_8888,
                },
                skData,
                w * 4
              );
              if (img) notifyStyled(img);
            }
          } else if (activeModel === 'ocr') {
            if (!ocrRof) return;
            const fw = frame.width;
            const fh = frame.height;
            const result = ocrRof(frame);
            if (result) {
              notifyOcr({
                detections: result,
                frameWidth: fw,
                frameHeight: fh,
              });
            }
          }
        } catch {
          // ignore
        } finally {
          frame.dispose();
        }
      },
      [
        activeModel,
        classRof,
        detRof,
        segRof,
        stRof,
        ocrRof,
        notifyClass,
        notifyDetections,
        notifyMask,
        notifyStyled,
        notifyOcr,
      ]
    ),
  });

  // ── Loading state: only care about the active model ──
  const activeIsReady = {
    classification: classification.isReady,
    object_detection: objectDetection.isReady,
    segmentation: segmentation.isReady,
    style_transfer: styleTransfer.isReady,
    ocr: ocr.isReady,
  }[activeModel];

  const activeDownloadProgress = {
    classification: classification.downloadProgress,
    object_detection: objectDetection.downloadProgress,
    segmentation: segmentation.downloadProgress,
    style_transfer: styleTransfer.downloadProgress,
    ocr: ocr.downloadProgress,
  }[activeModel];

  if (!cameraPermission.hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Camera access needed</Text>
        <TouchableOpacity
          onPress={() => cameraPermission.requestPermission()}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>No camera device found</Text>
      </View>
    );
  }

  // ── Cover-fit helpers ──
  function coverFit(imgW: number, imgH: number) {
    const scale = Math.max(canvasSize.width / imgW, canvasSize.height / imgH);
    return {
      scale,
      offsetX: (canvasSize.width - imgW * scale) / 2,
      offsetY: (canvasSize.height - imgH * scale) / 2,
    };
  }

  // ── OCR coord transform ──
  const {
    detections: ocrDets,
    frameWidth: ocrFW,
    frameHeight: ocrFH,
  } = ocrData;
  const ocrIsLandscape = ocrFW > ocrFH;
  const ocrImgW = ocrIsLandscape ? ocrFH : ocrFW;
  const ocrImgH = ocrIsLandscape ? ocrFW : ocrFH;
  const {
    scale: ocrScale,
    offsetX: ocrOX,
    offsetY: ocrOY,
  } = coverFit(ocrImgW, ocrImgH);
  function ocrToX(px: number, py: number) {
    return (ocrIsLandscape ? ocrFH - py : px) * ocrScale + ocrOX;
  }
  function ocrToY(px: number, py: number) {
    return (ocrIsLandscape ? px : py) * ocrScale + ocrOY;
  }

  // ── Object detection cover-fit ──
  const {
    scale: detScale,
    offsetX: detOX,
    offsetY: detOY,
  } = coverFit(imageSize.width, imageSize.height);

  const font = matchFont({ fontFamily: 'Helvetica', fontSize: 11 });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        outputs={[frameOutput]}
        isActive={true}
        format={format}
      />

      {/* ── Overlays ── */}
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        onLayout={(e) =>
          setCanvasSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        {activeModel === 'segmentation' && maskImage && (
          <Canvas style={StyleSheet.absoluteFill}>
            <SkiaImage
              image={maskImage}
              fit="cover"
              x={0}
              y={0}
              width={canvasSize.width}
              height={canvasSize.height}
            />
          </Canvas>
        )}

        {activeModel === 'style_transfer' && styledImage && (
          <Canvas style={StyleSheet.absoluteFill}>
            <SkiaImage
              image={styledImage}
              fit="cover"
              x={0}
              y={0}
              width={canvasSize.width}
              height={canvasSize.height}
            />
          </Canvas>
        )}

        {activeModel === 'object_detection' && (
          <>
            {detections.map((det, i) => {
              const left = det.bbox.x1 * detScale + detOX;
              const top = det.bbox.y1 * detScale + detOY;
              const w = (det.bbox.x2 - det.bbox.x1) * detScale;
              const h = (det.bbox.y2 - det.bbox.y1) * detScale;
              return (
                <View
                  key={i}
                  style={[styles.bbox, { left, top, width: w, height: h }]}
                >
                  <View style={styles.bboxLabel}>
                    <Text style={styles.bboxLabelText}>
                      {det.label} {(det.score * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {activeModel === 'ocr' && (
          <Canvas style={StyleSheet.absoluteFill}>
            {ocrDets.map((det, i) => {
              if (!det.bbox || det.bbox.length < 2) return null;
              const path = Skia.Path.Make();
              path.moveTo(
                ocrToX(det.bbox[0]!.x, det.bbox[0]!.y),
                ocrToY(det.bbox[0]!.x, det.bbox[0]!.y)
              );
              for (let j = 1; j < det.bbox.length; j++) {
                path.lineTo(
                  ocrToX(det.bbox[j]!.x, det.bbox[j]!.y),
                  ocrToY(det.bbox[j]!.x, det.bbox[j]!.y)
                );
              }
              path.close();
              const lx = ocrToX(det.bbox[0]!.x, det.bbox[0]!.y);
              const ly = Math.max(
                0,
                ocrToY(det.bbox[0]!.x, det.bbox[0]!.y) - 4
              );
              return (
                <React.Fragment key={i}>
                  <Path path={path} color="transparent" style="fill" />
                  <Path
                    path={path}
                    color={ColorPalette.primary}
                    style="stroke"
                    strokeWidth={2}
                  />
                  {font && (
                    <SkiaText
                      x={lx}
                      y={ly}
                      text={`${det.text} ${(det.score * 100).toFixed(0)}%`}
                      font={font}
                      color={ColorPalette.primary}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </Canvas>
        )}
      </View>

      {!activeIsReady && (
        <View style={styles.loadingOverlay}>
          <Spinner
            visible
            textContent={`Loading ${MODELS.find((m) => m.id === activeModel)?.label} ${(activeDownloadProgress * 100).toFixed(0)}%`}
          />
        </View>
      )}

      <View style={[styles.topBarWrapper, { paddingTop: insets.top + 8 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pickerContent}
        >
          {MODELS.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.chip, activeModel === m.id && styles.chipActive]}
              onPress={() => setActiveModel(m.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  activeModel === m.id && styles.chipTextActive,
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View
        style={[styles.bottomBarWrapper, { paddingBottom: insets.bottom + 12 }]}
        pointerEvents="none"
      >
        <View style={styles.bottomBar}>
          {activeModel === 'classification' && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText} numberOfLines={1}>
                {classResult.label || '—'}
              </Text>
              {classResult.label ? (
                <Text style={styles.resultSub}>
                  {(classResult.score * 100).toFixed(1)}%
                </Text>
              ) : null}
            </View>
          )}
          {activeModel === 'object_detection' && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>{detections.length}</Text>
              <Text style={styles.resultSub}>objects</Text>
            </View>
          )}
          {activeModel === 'segmentation' && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>DeepLab V3</Text>
              <Text style={styles.resultSub}>segmentation</Text>
            </View>
          )}
          {activeModel === 'style_transfer' && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>Rain Princess</Text>
              <Text style={styles.resultSub}>style</Text>
            </View>
          )}
          {activeModel === 'ocr' && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>{ocrDets.length}</Text>
              <Text style={styles.resultSub}>regions</Text>
            </View>
          )}
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{fps}</Text>
            <Text style={styles.statLabel}>fps</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  centered: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  message: { color: 'white', fontSize: 18 },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: ColorPalette.primary,
    borderRadius: 24,
  },
  buttonText: { color: 'white', fontSize: 15, fontWeight: '600' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  pickerContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipActive: {
    backgroundColor: ColorPalette.primary,
    borderColor: ColorPalette.primary,
  },
  chipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: { color: 'white' },
  bbox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: ColorPalette.primary,
    borderRadius: 4,
  },
  bboxLabel: {
    position: 'absolute',
    top: -22,
    left: -2,
    backgroundColor: ColorPalette.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bboxLabelText: { color: 'white', fontSize: 11, fontWeight: '600' },
  bottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 10,
    gap: 24,
  },
  resultContainer: { alignItems: 'flex-start', maxWidth: 220 },
  resultText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  resultSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statItem: { alignItems: 'center' },
  statValue: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
