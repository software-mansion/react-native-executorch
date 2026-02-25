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
import { EFFICIENTNET_V2_S, useClassification } from 'react-native-executorch';
import { GeneratingContext } from '../../context';
import Spinner from '../../components/Spinner';
import ColorPalette from '../../colors';

export default function ClassificationLiveScreen() {
  const insets = useSafeAreaInsets();

  const { isReady, isGenerating, downloadProgress, runOnFrame } =
    useClassification({ model: EFFICIENTNET_V2_S });
  const { setGlobalGenerating } = useContext(GeneratingContext);

  useEffect(() => {
    setGlobalGenerating(isGenerating);
  }, [isGenerating, setGlobalGenerating]);

  const [topLabel, setTopLabel] = useState('');
  const [topScore, setTopScore] = useState(0);
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

  const updateStats = useCallback(
    (result: { label: string; score: number }) => {
      setTopLabel(result.label);
      setTopScore(result.score);
      const now = Date.now();
      const timeDiff = now - lastFrameTimeRef.current;
      if (timeDiff > 0) {
        setFps(Math.round(1000 / timeDiff));
      }
      lastFrameTimeRef.current = now;
    },
    []
  );

  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    onFrame(frame) {
      'worklet';
      if (!runOnFrame) {
        frame.dispose();
        return;
      }
      try {
        const result = runOnFrame(frame);
        if (result) {
          // find the top-1 entry
          let bestLabel = '';
          let bestScore = -1;
          const entries = Object.entries(result);
          for (let i = 0; i < entries.length; i++) {
            const [label, score] = entries[i];
            if ((score as number) > bestScore) {
              bestScore = score as number;
              bestLabel = label;
            }
          }
          scheduleOnRN(updateStats, { label: bestLabel, score: bestScore });
        }
      } catch {
        // ignore frame errors
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

      <View
        style={[styles.bottomBarWrapper, { paddingBottom: insets.bottom + 12 }]}
        pointerEvents="none"
      >
        <View style={styles.bottomBar}>
          <View style={styles.labelContainer}>
            <Text style={styles.labelText} numberOfLines={1}>
              {topLabel || '—'}
            </Text>
            <Text style={styles.scoreText}>
              {topLabel ? (topScore * 100).toFixed(1) + '%' : ''}
            </Text>
          </View>
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
    paddingHorizontal: 16,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 10,
    gap: 24,
    maxWidth: '100%',
  },
  labelContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  labelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  scoreText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
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
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
