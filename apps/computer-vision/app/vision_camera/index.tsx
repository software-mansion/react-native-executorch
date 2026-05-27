import React, { useCallback, useContext, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import Constants from 'expo-constants';
import {
  Camera,
  useCameraDevices,
  useCameraPermission,
  useFrameOutput,
} from 'react-native-vision-camera';
import { createSynchronizable } from 'react-native-worklets';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GeneratingContext } from '../../context';
import Spinner from '../../components/Spinner';
import ColorPalette from '../../colors';
import ObjectDetectionTask from '../../components/vision_camera/tasks/ObjectDetectionTask';
import ErrorBanner from '../../components/ErrorBanner';

export default function VisionCameraScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [frameKillSwitch] = useState(() => createSynchronizable(false));
  const [cameraPositionSync] = useState(() =>
    createSynchronizable<'front' | 'back'>('back')
  );
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [fps, setFps] = useState(0);
  const [frameMs, setFrameMs] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [frameOutput, setFrameOutput] = useState<ReturnType<
    typeof useFrameOutput
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { setGlobalGenerating } = useContext(GeneratingContext);

  const isFocused = useIsFocused();
  const cameraPermission = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back') ?? devices[0];

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

  const handleErrorChange = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
  }, []);

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      <View style={[styles.errorOverlay, { paddingTop: insets.top }]}>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      </View>

      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        outputs={frameOutput ? [frameOutput] : []}
        isActive={isFocused}
        orientationSource="device"
        constraints={
          Constants.isDevice
            ? [{ previewStabilizationMode: 'cinematic-extended' }]
            : []
        }
        onError={(e) => setError(e.message)}
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
      />

      <ObjectDetectionTask
        activeModel="objectDetectionRfdetr"
        canvasSize={canvasSize}
        cameraPositionSync={cameraPositionSync}
        frameKillSwitch={frameKillSwitch}
        onFrameOutputChange={setFrameOutput}
        onReadyChange={setIsReady}
        onProgressChange={setDownloadProgress}
        onGeneratingChange={handleGeneratingChange}
        onFpsChange={handleFpsChange}
        onErrorChange={handleErrorChange}
      />

      {!isReady && !error && (
        <View style={styles.loadingOverlay}>
          <Spinner
            visible
            textContent={`Loading ${(downloadProgress * 100).toFixed(0)}%`}
          />
        </View>
      )}

      <View
        style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 8 }]}
          onPress={() => router.navigate('/')}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.landscapeTitle} pointerEvents="none">
        <Text style={styles.modelTitle}>RF-DETR Object Detection</Text>
        <Text style={styles.fpsText}>
          {fps} FPS – {frameMs.toFixed(0)} ms
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
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
    zIndex: 10,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
    zIndex: 5,
  },
  titleRow: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  landscapeTitle: {
    position: 'absolute',
    right: -90,
    top: '50%',
    alignItems: 'center',
    transform: [{ rotate: '90deg' }],
    zIndex: 6,
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
  backButton: {
    position: 'absolute',
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    zIndex: 10,
  },
});
