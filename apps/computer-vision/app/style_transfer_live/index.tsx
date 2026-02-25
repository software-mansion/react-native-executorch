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
  STYLE_TRANSFER_RAIN_PRINCESS,
  useStyleTransfer,
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

export default function StyleTransferLiveScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const { isReady, isGenerating, downloadProgress, runOnFrame } =
    useStyleTransfer({ model: STYLE_TRANSFER_RAIN_PRINCESS });
  const { setGlobalGenerating } = useContext(GeneratingContext);

  useEffect(() => {
    setGlobalGenerating(isGenerating);
  }, [isGenerating, setGlobalGenerating]);

  const [styledImage, setStyledImage] = useState<SkImage | null>(null);
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

  const updateImage = useCallback((img: SkImage) => {
    setStyledImage((prev) => {
      prev?.dispose();
      return img;
    });
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
        const result = runOnFrame(frame);
        if (result?.dataPtr) {
          const { dataPtr, sizes } = result;
          const height = sizes[0];
          const width = sizes[1];
          // Build Skia image on the worklet thread — avoids transferring the
          // large pixel buffer across the worklet→RN boundary via scheduleOnRN.
          const skData = Skia.Data.fromBytes(dataPtr);
          const img = Skia.Image.MakeImage(
            {
              width,
              height,
              alphaType: AlphaType.Opaque,
              colorType: ColorType.RGBA_8888,
            },
            skData,
            width * 4
          );
          if (img) {
            scheduleOnRN(updateImage, img);
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

      {/* Camera always runs to keep frame processing active */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        outputs={[frameOutput]}
        isActive={true}
        format={format}
      />

      {/* Styled output overlays the camera feed once available */}
      {styledImage && (
        <Canvas style={StyleSheet.absoluteFill}>
          <SkiaImage
            image={styledImage}
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
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.styleLabel}>candy</Text>
            <Text style={styles.statLabel}>style</Text>
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
  styleLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
