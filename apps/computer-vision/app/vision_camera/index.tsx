import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import { useIsFocused } from '@react-navigation/native';
import {
  Camera,
  getCameraFormat,
  Templates,
  useCameraDevices,
  useCameraPermission,
  useFrameOutput,
} from 'react-native-vision-camera';
import { createSynchronizable } from 'react-native-worklets';
import Svg, { Path, Polygon } from 'react-native-svg';
import { GeneratingContext } from '../../context';
import Spinner from '../../components/Spinner';
import ColorPalette from '../../colors';
import ClassificationTask from '../../components/vision_camera/tasks/ClassificationTask';
import ObjectDetectionTask from '../../components/vision_camera/tasks/ObjectDetectionTask';
import SegmentationTask from '../../components/vision_camera/tasks/SegmentationTask';
import InstanceSegmentationTask from '../../components/vision_camera/tasks/InstanceSegmentationTask';

type TaskId =
  | 'classification'
  | 'objectDetection'
  | 'segmentation'
  | 'instanceSegmentation';
type ModelId =
  | 'classification'
  | 'objectDetectionSsdlite'
  | 'objectDetectionRfdetr'
  | 'segmentationDeeplabResnet50'
  | 'segmentationDeeplabResnet101'
  | 'segmentationDeeplabMobilenet'
  | 'segmentationLraspp'
  | 'segmentationFcnResnet50'
  | 'segmentationFcnResnet101'
  | 'segmentationSelfie'
  | 'instanceSegmentationYolo26n'
  | 'instanceSegmentationRfdetr';

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
    variants: [
      { id: 'segmentationDeeplabResnet50', label: 'DeepLab ResNet50' },
      { id: 'segmentationDeeplabResnet101', label: 'DeepLab ResNet101' },
      { id: 'segmentationDeeplabMobilenet', label: 'DeepLab MobileNet' },
      { id: 'segmentationLraspp', label: 'LRASPP MobileNet' },
      { id: 'segmentationFcnResnet50', label: 'FCN ResNet50' },
      { id: 'segmentationFcnResnet101', label: 'FCN ResNet101' },
      { id: 'segmentationSelfie', label: 'Selfie' },
    ],
  },
  {
    id: 'instanceSegmentation',
    label: 'Inst Seg',
    variants: [
      { id: 'instanceSegmentationYolo26n', label: 'YOLO26N Seg' },
      { id: 'instanceSegmentationRfdetr', label: 'RF-DETR Nano Seg' },
    ],
  },
  {
    id: 'objectDetection',
    label: 'Detect',
    variants: [
      { id: 'objectDetectionSsdlite', label: 'SSDLite MobileNet' },
      { id: 'objectDetectionRfdetr', label: 'RF-DETR Nano' },
    ],
  },
];

// Module-level consts so worklets in task components can always reference the same stable objects.
// Never replaced — only mutated via setBlocking to avoid closure staleness.
const frameKillSwitch = createSynchronizable(false);
const cameraPositionSync = createSynchronizable<'front' | 'back'>('back');

export default function VisionCameraScreen() {
  const insets = useSafeAreaInsets();
  const [activeTask, setActiveTask] = useState<TaskId>('classification');
  const [activeModel, setActiveModel] = useState<ModelId>('classification');
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>(
    'back'
  );
  const [fps, setFps] = useState(0);
  const [frameMs, setFrameMs] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [frameOutput, setFrameOutput] = useState<ReturnType<
    typeof useFrameOutput
  > | null>(null);
  const { setGlobalGenerating } = useContext(GeneratingContext);

  const isFocused = useIsFocused();
  const cameraPermission = useCameraPermission();
  const devices = useCameraDevices();
  const device =
    devices.find((d) => d.position === cameraPosition) ?? devices[0];
  const format = useMemo(() => {
    if (device == null) return undefined;
    try {
      return getCameraFormat(device, Templates.FrameProcessing);
    } catch {
      return undefined;
    }
  }, [device]);

  useEffect(() => {
    frameKillSwitch.setBlocking(true);
    const id = setTimeout(() => {
      frameKillSwitch.setBlocking(false);
    }, 300);
    return () => clearTimeout(id);
  }, [activeModel]);

  useEffect(() => {
    cameraPositionSync.setBlocking(cameraPosition);
  }, [cameraPosition]);

  const handleFpsChange = useCallback((newFps: number, newMs: number) => {
    setFps(newFps);
    setFrameMs(newMs);
  }, []);

  const handleGeneratingChange = useCallback(
    (generating: boolean) => {
      setGlobalGenerating(generating);
    },
    [setGlobalGenerating]
  );

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

  const activeTaskInfo = TASKS.find((t) => t.id === activeTask)!;
  const activeVariantLabel =
    activeTaskInfo.variants.find((v) => v.id === activeModel)?.label ??
    activeTaskInfo.variants[0]!.label;

  const taskProps = {
    activeModel,
    canvasSize,
    cameraPosition,
    cameraPositionSync,
    frameKillSwitch,
    onFrameOutputChange: setFrameOutput,
    onReadyChange: setIsReady,
    onProgressChange: setDownloadProgress,
    onGeneratingChange: handleGeneratingChange,
    onFpsChange: handleFpsChange,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        outputs={frameOutput ? [frameOutput] : []}
        isActive={isFocused}
        format={format}
        orientationSource="device"
      />

      {/* Layout sentinel — measures the full-screen area for bbox/canvas sizing */}
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        onLayout={(e) =>
          setCanvasSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      />

      {activeTask === 'classification' && <ClassificationTask {...taskProps} />}
      {activeTask === 'objectDetection' && (
        <ObjectDetectionTask
          {...taskProps}
          activeModel={
            activeModel as 'objectDetectionSsdlite' | 'objectDetectionRfdetr'
          }
        />
      )}
      {activeTask === 'segmentation' && (
        <SegmentationTask
          {...taskProps}
          activeModel={
            activeModel as
              | 'segmentationDeeplabResnet50'
              | 'segmentationDeeplabResnet101'
              | 'segmentationDeeplabMobilenet'
              | 'segmentationLraspp'
              | 'segmentationFcnResnet50'
              | 'segmentationFcnResnet101'
              | 'segmentationSelfie'
          }
        />
      )}
      {activeTask === 'instanceSegmentation' && (
        <InstanceSegmentationTask
          {...taskProps}
          activeModel={
            activeModel as
              | 'instanceSegmentationYolo26n'
              | 'instanceSegmentationRfdetr'
          }
        />
      )}

      {!isReady && (
        <View style={styles.loadingOverlay}>
          <Spinner
            visible
            textContent={`Loading ${activeTaskInfo.label} ${(downloadProgress * 100).toFixed(0)}%`}
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

      <View
        style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 16 }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.flipButton}
          onPress={() =>
            setCameraPosition((p) => (p === 'back' ? 'front' : 'back'))
          }
        >
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
              d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
              stroke="white"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M9 13.5a3 3 0 1 0 3-3"
              stroke="white"
              strokeWidth={1.8}
              strokeLinecap="round"
            />
            <Polygon points="8,11 9,13.5 11,12" fill="white" />
          </Svg>
        </TouchableOpacity>
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
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
});
