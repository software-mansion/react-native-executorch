import React, {
  useCallback,
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
import { useIsFocused } from '@react-navigation/native';
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
import Svg, { Path, Polygon } from 'react-native-svg';
import { useLLM } from 'react-native-executorch';
import Spinner from '../../components/Spinner';
import ErrorBanner from '../../components/ErrorBanner';
import ColorPalette from '../../colors';

const LFM2_VL_450M = {
  modelName: 'lfm2.5-vl-1.6b-quantized' as const,
  capabilities: ['vision'] as const,
  modelSource:
    'https://huggingface.co/nklockiewicz/lfm2-vl-et/resolve/main/lfm2_vl_450M_xnnpack_quantized.pte',
  tokenizerSource: require('../../assets/tokenizers/tokenizer.json'),
  tokenizerConfigSource: require('../../assets/tokenizers/tokenizer_config.json'),
};

const DEFAULT_USER_MESSAGE = 'What is on this image? Answer in one sentence.';

const cameraPositionSync = createSynchronizable<'front' | 'back'>('back');

export default function VLMCameraScreen() {
  const insets = useSafeAreaInsets();
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>(
    'back'
  );
  const [messages, setMessages] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generationMs, setGenerationMs] = useState(0);
  const lastGenerationTimeRef = useRef(Date.now());

  const isFocused = useIsFocused();
  const cameraPermission = useCameraPermission();
  const devices = useCameraDevices();
  const device =
    devices.find((d) => d.position === cameraPosition) ?? devices[0];
  const format = useMemo(() => {
    if (device == null) return undefined;
    try {
      return getCameraFormat(device, { ...Templates.FrameProcessing });
    } catch {
      return undefined;
    }
  }, [device]);

  const model = useLLM({ model: LFM2_VL_450M });

  useEffect(() => {
    if (model.error) {
      setError(String(model.error));
    }
  }, [model.error]);

  useEffect(() => {
    cameraPositionSync.setBlocking(cameraPosition);
  }, [cameraPosition]);

  const MAX_MESSAGES = 5;

  const onToken = useCallback((token: string) => {
    setCurrentResponse((prev) => prev + token);
  }, []);

  const buildRunOnFrame = model.buildRunOnFrame;
  const runOnFrame = useMemo(
    () =>
      buildRunOnFrame ? buildRunOnFrame(DEFAULT_USER_MESSAGE, onToken) : null,
    [buildRunOnFrame, onToken]
  );

  const finalizeAndClear = useCallback(() => {
    const now = Date.now();
    const diff = now - lastGenerationTimeRef.current;
    lastGenerationTimeRef.current = now;
    if (diff > 0) {
      setGenerationMs(diff);
    }
    setCurrentResponse((prev) => {
      if (prev.trim()) {
        setMessages((msgs) => [...msgs, prev.trim()].slice(-MAX_MESSAGES));
      }
      return '';
    });
  }, []);

  const updateError = useCallback((msg: string) => {
    setError(msg);
  }, []);

  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    enablePreviewSizedOutputBuffers: true,
    onFrame: useCallback(
      (frame: Frame) => {
        'worklet';
        try {
          if (!runOnFrame) return;
          scheduleOnRN(finalizeAndClear);
          const isFrontCamera = cameraPositionSync.getDirty() === 'front';
          runOnFrame(frame, isFrontCamera);
        } catch (e: any) {
          const msg = e?.message ?? String(e);
          scheduleOnRN(updateError, msg);
        } finally {
          frame.dispose();
        }
      },
      [runOnFrame, updateError, finalizeAndClear]
    ),
  });

  // Mirror the vision_camera pattern: store frameOutput in state so Camera
  // re-renders when useFrameOutput returns a new value after deps change.
  const [activeFrameOutput, setActiveFrameOutput] = useState<ReturnType<
    typeof useFrameOutput
  > | null>(null);

  useEffect(() => {
    setActiveFrameOutput(runOnFrame ? frameOutput : null);
  }, [frameOutput, runOnFrame]);

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
        outputs={activeFrameOutput ? [activeFrameOutput] : []}
        isActive={isFocused && model.isReady}
        format={format}
        orientationSource="device"
      />

      {!model.isReady && !error && (
        <View style={styles.loadingOverlay}>
          <Spinner
            visible
            textContent={`Loading VLM ${(model.downloadProgress * 100).toFixed(0)}%`}
          />
        </View>
      )}

      <View
        style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}
        pointerEvents="none"
      >
        <Text style={styles.modelTitle}>VLM Camera</Text>
        {generationMs > 0 && (
          <Text style={styles.fpsText}>
            {(1000 / generationMs).toFixed(2)} gen/s –{' '}
            {(generationMs / 1000).toFixed(1)}s
          </Text>
        )}
      </View>

      {(messages.length > 0 || currentResponse !== '') && (
        <View style={styles.responseOverlay} pointerEvents="none">
          {messages.map((msg, i) => (
            <Text
              key={i}
              style={[
                styles.responseText,
                styles.oldMessage,
                i < messages.length - 1 && styles.fadedMessage,
              ]}
            >
              {msg}
            </Text>
          ))}
          {currentResponse !== '' && (
            <Text style={[styles.responseText, styles.currentMessage]}>
              {currentResponse}
            </Text>
          )}
        </View>
      )}

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
    zIndex: 5,
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
  responseOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 16,
    zIndex: 5,
  },
  responseText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  oldMessage: {
    marginBottom: 8,
  },
  fadedMessage: {
    opacity: 0.4,
  },
  currentMessage: {
    opacity: 0.8,
    fontStyle: 'italic' as const,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
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
