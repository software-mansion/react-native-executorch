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
import { createSynchronizable, scheduleOnRN } from 'react-native-worklets';
import {
  DEEPLAB_V3_RESNET50,
  Detection,
  EFFICIENTNET_V2_S,
  SSDLITE_320_MOBILENET_V3_LARGE,
  useClassification,
  useImageSegmentation,
  useObjectDetection,
} from 'react-native-executorch';
import {
  AlphaType,
  Canvas,
  ColorType,
  Image as SkiaImage,
  Skia,
  SkImage,
} from '@shopify/react-native-skia';
import { GeneratingContext } from '../../context';
import Spinner from '../../components/Spinner';
import ColorPalette from '../../colors';

type TaskId = 'classification' | 'objectDetection' | 'segmentation';
type ModelId = 'classification' | 'objectDetection' | 'segmentation';

type TaskVariant = { id: ModelId; label: string };
type Task = { id: TaskId; label: string; variants: TaskVariant[] };

const TASKS: Task[] = [
  {
    id: 'classification',
    label: 'Classify',
    variants: [{ id: 'classification', label: 'EfficientNet V2 S' }],
  },
  {
    id: 'segmentation',
    label: 'Segment',
    variants: [{ id: 'segmentation', label: 'DeepLab V3' }],
  },
  {
    id: 'objectDetection',
    label: 'Detect',
    variants: [{ id: 'objectDetection', label: 'SSDLite MobileNet' }],
  },
];

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

function hashLabel(label: string): number {
  let hash = 5381;
  for (let i = 0; i < label.length; i++) {
    hash = (hash + hash * 32 + label.charCodeAt(i)) % 1000003;
  }
  return 1 + (Math.abs(hash) % (CLASS_COLORS.length - 1));
}

function labelColor(label: string): string {
  const color = CLASS_COLORS[hashLabel(label)]!;
  return `rgba(${color[0]},${color[1]},${color[2]},1)`;
}

function labelColorBg(label: string): string {
  const color = CLASS_COLORS[hashLabel(label)]!;
  return `rgba(${color[0]},${color[1]},${color[2]},0.75)`;
}

const frameKillSwitch = createSynchronizable(false);

export default function VisionCameraScreen() {
  const insets = useSafeAreaInsets();
  const [activeTask, setActiveTask] = useState<TaskId>('classification');
  const [activeModel, setActiveModel] = useState<ModelId>('classification');
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const { setGlobalGenerating } = useContext(GeneratingContext);

  const classification = useClassification({
    model: EFFICIENTNET_V2_S,
    preventLoad: activeModel !== 'classification',
  });
  const objectDetection = useObjectDetection({
    model: SSDLITE_320_MOBILENET_V3_LARGE,
    preventLoad: activeModel !== 'objectDetection',
  });
  const segmentation = useImageSegmentation({
    model: DEEPLAB_V3_RESNET50,
    preventLoad: activeModel !== 'segmentation',
  });

  const activeIsGenerating = {
    classification: classification.isGenerating,
    objectDetection: objectDetection.isGenerating,
    segmentation: segmentation.isGenerating,
  }[activeModel];

  useEffect(() => {
    setGlobalGenerating(activeIsGenerating);
  }, [activeIsGenerating, setGlobalGenerating]);

  const [fps, setFps] = useState(0);
  const [frameMs, setFrameMs] = useState(0);
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

  const [classResult, setClassResult] = useState({ label: '', score: 0 });
  const [detections, setDetections] = useState<Detection[]>([]);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [maskImage, setMaskImage] = useState<SkImage | null>(null);

  const updateClass = useCallback((r: { label: string; score: number }) => {
    setClassResult(r);
    const now = Date.now();
    const diff = now - lastFrameTimeRef.current;
    if (diff > 0) {
      setFps(Math.round(1000 / diff));
      setFrameMs(diff);
    }
    lastFrameTimeRef.current = now;
  }, []);

  const updateFps = useCallback(() => {
    const now = Date.now();
    const diff = now - lastFrameTimeRef.current;
    if (diff > 0) {
      setFps(Math.round(1000 / diff));
      setFrameMs(diff);
    }
    lastFrameTimeRef.current = now;
  }, []);

  const updateDetections = useCallback(
    (p: { results: Detection[]; imageWidth: number; imageHeight: number }) => {
      setDetections(p.results);
      setImageSize({ width: p.imageWidth, height: p.imageHeight });
      updateFps();
    },
    [updateFps]
  );

  const updateMask = useCallback(
    (img: SkImage) => {
      setMaskImage((prev) => {
        prev?.dispose();
        return img;
      });
      updateFps();
    },
    [updateFps]
  );

  const classRof = classification.runOnFrame;
  const detRof = objectDetection.runOnFrame;
  const segRof = segmentation.runOnFrame;

  useEffect(() => {
    frameKillSwitch.setBlocking(true);
    setMaskImage((prev) => {
      prev?.dispose();
      return null;
    });
    const id = setTimeout(() => {
      frameKillSwitch.setBlocking(false);
    }, 300);
    return () => clearTimeout(id);
  }, [activeModel]);

  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    onFrame: useCallback(
      (frame: Frame) => {
        'worklet';

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
              scheduleOnRN(updateClass, { label: bestLabel, score: bestScore });
            }
          } else if (activeModel === 'objectDetection') {
            if (!detRof) return;
            const iw = frame.width > frame.height ? frame.height : frame.width;
            const ih = frame.width > frame.height ? frame.width : frame.height;
            const result = detRof(frame, 0.5);
            if (result) {
              scheduleOnRN(updateDetections, {
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
              if (img) scheduleOnRN(updateMask, img);
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
        updateClass,
        updateDetections,
        updateMask,
      ]
    ),
  });

  const activeIsReady = {
    classification: classification.isReady,
    objectDetection: objectDetection.isReady,
    segmentation: segmentation.isReady,
  }[activeModel];

  const activeDownloadProgress = {
    classification: classification.downloadProgress,
    objectDetection: objectDetection.downloadProgress,
    segmentation: segmentation.downloadProgress,
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

  function coverFit(imgW: number, imgH: number) {
    const scale = Math.max(canvasSize.width / imgW, canvasSize.height / imgH);
    return {
      scale,
      offsetX: (canvasSize.width - imgW * scale) / 2,
      offsetY: (canvasSize.height - imgH * scale) / 2,
    };
  }

  const {
    scale: detScale,
    offsetX: detOX,
    offsetY: detOY,
  } = coverFit(imageSize.width, imageSize.height);

  const activeTaskInfo = TASKS.find((t) => t.id === activeTask)!;
  const activeVariantLabel =
    activeTaskInfo.variants.find((v) => v.id === activeModel)?.label ??
    activeTaskInfo.variants[0]!.label;

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

        {activeModel === 'objectDetection' && (
          <>
            {detections.map((det, i) => {
              const left = det.bbox.x1 * detScale + detOX;
              const top = det.bbox.y1 * detScale + detOY;
              const w = (det.bbox.x2 - det.bbox.x1) * detScale;
              const h = (det.bbox.y2 - det.bbox.y1) * detScale;
              return (
                <View
                  key={i}
                  style={[
                    styles.bbox,
                    {
                      left,
                      top,
                      width: w,
                      height: h,
                      borderColor: labelColor(det.label),
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.bboxLabel,
                      { backgroundColor: labelColorBg(det.label) },
                    ]}
                  >
                    <Text style={styles.bboxLabelText}>
                      {det.label} {(det.score * 100).toFixed(1)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </View>

      {activeModel === 'classification' && classResult.label ? (
        <View style={styles.classResultOverlay} pointerEvents="none">
          <Text style={styles.classResultLabel}>{classResult.label}</Text>
          <Text style={styles.classResultScore}>
            {(classResult.score * 100).toFixed(1)}%
          </Text>
        </View>
      ) : null}

      {!activeIsReady && (
        <View style={styles.loadingOverlay}>
          <Spinner
            visible
            textContent={`Loading ${activeTaskInfo.label} ${(activeDownloadProgress * 100).toFixed(0)}%`}
          />
        </View>
      )}

      <View
        style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <View style={styles.titleRow} pointerEvents="none">
          <Text style={styles.modelTitle}>{activeVariantLabel}</Text>
          <Text style={styles.fpsText}>
            {fps} FPS – {frameMs.toFixed(0)} ms
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          pointerEvents="box-none"
        >
          {TASKS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, activeTask === t.id && styles.tabActive]}
              onPress={() => {
                setActiveTask(t.id);
                setActiveModel(t.variants[0]!.id);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTask === t.id && styles.tabTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          pointerEvents="box-none"
        >
          {activeTaskInfo.variants.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={[
                styles.variantChip,
                activeModel === v.id && styles.variantChipActive,
              ]}
              onPress={() => setActiveModel(v.id)}
            >
              <Text
                style={[
                  styles.variantChipText,
                  activeModel === v.id && styles.variantChipTextActive,
                ]}
              >
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

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

  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  titleRow: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modelTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  fpsText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  tabsContent: {
    paddingHorizontal: 12,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'white',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: { color: 'white' },

  chipsContent: {
    paddingHorizontal: 12,
    gap: 6,
  },
  variantChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  variantChipActive: {
    backgroundColor: ColorPalette.primary,
    borderColor: ColorPalette.primary,
  },
  variantChipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  variantChipTextActive: { color: 'white' },

  bbox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'cyan',
    borderRadius: 4,
  },
  bboxLabel: {
    position: 'absolute',
    top: -22,
    left: -2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bboxLabelText: { color: 'white', fontSize: 11, fontWeight: '600' },

  classResultOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classResultLabel: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    paddingHorizontal: 24,
  },
  classResultScore: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
