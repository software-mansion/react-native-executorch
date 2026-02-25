import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Camera,
  getCameraFormat,
  Templates,
  useCameraDevices,
  useCameraPermission,
  useFrameOutput,
} from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import {
  DEEPLAB_V3_RESNET50,
  useImageSegmentation,
} from 'react-native-executorch';
import {
  Canvas,
  Image as SkiaImage,
  Skia,
  AlphaType,
  ColorType,
  SkImage,
} from '@shopify/react-native-skia';
import { GeneratingContext } from '../../context';
import Spinner from '../../components/Spinner';
import ColorPalette from '../../colors';

// RGBA colors for each DeepLab V3 class (alpha = 180 for semi-transparency)
const CLASS_COLORS: number[][] = [
  [0, 0, 0, 0], // 0 background — transparent
  [51, 255, 87, 180], // 1 aeroplane
  [51, 87, 255, 180], // 2 bicycle
  [255, 51, 246, 180], // 3 bird
  [51, 255, 246, 180], // 4 boat
  [243, 255, 51, 180], // 5 bottle
  [141, 51, 255, 180], // 6 bus
  [255, 131, 51, 180], // 7 car
  [51, 255, 131, 180], // 8 cat
  [131, 51, 255, 180], // 9 chair
  [255, 255, 51, 180], // 10 cow
  [51, 255, 255, 180], // 11 diningtable
  [255, 51, 143, 180], // 12 dog
  [127, 51, 255, 180], // 13 horse
  [51, 255, 175, 180], // 14 motorbike
  [255, 175, 51, 180], // 15 person
  [179, 255, 51, 180], // 16 pottedplant
  [255, 87, 51, 180], // 17 sheep
  [255, 51, 162, 180], // 18 sofa
  [51, 162, 255, 180], // 19 train
  [162, 51, 255, 180], // 20 tvmonitor
];

export default function ImageSegmentationLiveScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const { isReady, isGenerating, downloadProgress, runOnFrame } =
    useImageSegmentation({ model: DEEPLAB_V3_RESNET50 });
  const { setGlobalGenerating } = useContext(GeneratingContext);

  useEffect(() => {
    setGlobalGenerating(isGenerating);
  }, [isGenerating, setGlobalGenerating]);

  const [maskImage, setMaskImage] = useState<SkImage | null>(null);
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

  const updateMask = useCallback((img: SkImage) => {
    setMaskImage(img);
    const now = Date.now();
    const timeDiff = now - lastFrameTimeRef.current;
    if (timeDiff > 0) {
      setFps(Math.round(1000 / timeDiff));
    }
    lastFrameTimeRef.current = now;
  }, []);

  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    onFrame(frame) {
      'worklet';
      if (!runOnFrame) {
        frame.dispose();
        return;
      }
      try {
        const result = runOnFrame(frame, [], false);
        if (result?.ARGMAX) {
          const argmax: Int32Array = result.ARGMAX;
          // Model output is always square (modelImageSize × modelImageSize).
          // Derive width/height from argmax length (sqrt for square output).
          const side = Math.round(Math.sqrt(argmax.length));
          const width = side;
          const height = side;

          // Build RGBA pixel buffer on the worklet thread to avoid transferring
          // the large Int32Array across the worklet→RN boundary via scheduleOnRN.
          const pixels = new Uint8Array(width * height * 4);
          for (let i = 0; i < argmax.length; i++) {
            const color = CLASS_COLORS[argmax[i]] ?? [0, 0, 0, 0];
            pixels[i * 4] = color[0]!;
            pixels[i * 4 + 1] = color[1]!;
            pixels[i * 4 + 2] = color[2]!;
            pixels[i * 4 + 3] = color[3]!;
          }

          const skData = Skia.Data.fromBytes(pixels);
          const img = Skia.Image.MakeImage(
            {
              width,
              height,
              alphaType: AlphaType.Unpremul,
              colorType: ColorType.RGBA_8888,
            },
            skData,
            width * 4
          );
          if (img) {
            scheduleOnRN(updateMask, img);
          }
        }
      } catch (e) {
        console.log('frame error:', String(e));
      } finally {
        frame.dispose();
      }
    },
  });

  if (!isReady) {
    return (
      <Spinner
        visible={!isReady}
        textContent={`Loading the model ${(downloadProgress * 100).toFixed(0)} %`}
      />
    );
  }

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

      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        outputs={[frameOutput]}
        isActive={true}
        format={format}
      />

      {maskImage && (
        <Canvas style={StyleSheet.absoluteFill}>
          <SkiaImage
            image={maskImage}
            fit="cover"
            x={0}
            y={0}
            width={screenWidth}
            height={screenHeight}
          />
        </Canvas>
      )}

      <View
        style={[styles.bottomBarWrapper, { paddingBottom: insets.bottom + 12 }]}
        pointerEvents="none"
      >
        <View style={styles.bottomBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{fps}</Text>
            <Text style={styles.statLabel}>fps</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centered: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  message: {
    color: 'white',
    fontSize: 18,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: ColorPalette.primary,
    borderRadius: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 10,
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
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
