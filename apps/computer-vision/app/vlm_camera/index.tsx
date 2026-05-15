import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Camera,
  useCameraDevices,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';
import * as FileSystem from 'expo-file-system/legacy';
import {
  AudioManager,
  AudioRecorder,
  AudioContext,
} from 'react-native-audio-api';
import type {
  AudioBufferSourceNode,
  AudioBuffer,
} from 'react-native-audio-api';
import {
  useLLM,
  useSpeechToText,
  useTextToSpeech,
  LFM2_5_VL_450M_QUANTIZED,
  WHISPER_TINY_EN,
  KOKORO_SMALL,
  KOKORO_VOICE_AF_HEART,
} from 'react-native-executorch';
import ColorPalette from '../../colors';

type ScreenState =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'thinking'
  | 'speaking';

const SAMPLE_RATE = 16000;

// Per-turn logging anchor. Reset at the start of each recording so all
// downstream logs report (absolute time + ms-since-turn-start).
let __turnStart = 0;
function tlog(msg: string, extra?: unknown) {
  const now = Date.now();
  const delta = __turnStart ? now - __turnStart : 0;
  const ts = new Date(now).toISOString().slice(11, 23);
  if (extra !== undefined) {
    console.log(`[vlm_camera] ${ts} +${delta}ms ${msg}`, extra);
  } else {
    console.log(`[vlm_camera] ${ts} +${delta}ms ${msg}`);
  }
}

export default function VLMCameraScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isFocused = useIsFocused();
  const cameraPermission = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back') ?? devices[0];

  const [error, setError] = useState<string | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [transcript, setTranscript] = useState('');

  const recorderRef = useRef(new AudioRecorder());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ttsSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isRecordingRef = useRef(false);
  const sttStreamPromiseRef = useRef<Promise<void> | null>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
    audioCtxRef.current.suspend();
    return () => {
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['defaultToSpeaker'],
    });
    AudioManager.requestRecordingPermissions().then((status) => {
      setHasMicPermission(status === 'Granted');
      if (status !== 'Granted') {
        setError('Microphone permission denied. Enable it in Settings.');
      }
    });
  }, []);

  const [sttPreventLoad, setSttPreventLoad] = useState(false);

  const llm = useLLM({
    model: { ...LFM2_5_VL_450M_QUANTIZED, capabilities: ['vision'] as const },
  });
  const stt = useSpeechToText({
    model: WHISPER_TINY_EN,
    preventLoad: sttPreventLoad,
  });
  const tts = useTextToSpeech({
    model: KOKORO_SMALL,
    voice: KOKORO_VOICE_AF_HEART,
  });

  const sttEverReady = useRef(false);
  if (stt.isReady) sttEverReady.current = true;
  const allReady = llm.isReady && sttEverReady.current && tts.isReady;
  const avgProgress =
    (llm.downloadProgress +
      (sttEverReady.current ? 1 : stt.downloadProgress) +
      tts.downloadProgress) /
    3;

  useEffect(() => {
    const firstError = llm.error ?? stt.error ?? tts.error;
    if (firstError) setError(String(firstError));
  }, [llm.error, stt.error, tts.error]);

  // One photo output for on-demand still capture. No frame processor, no
  // worklet — we only need a single frame per prompt. Force JPEG
  // container so the bytes are decodable by OpenCV on the native side
  // (iOS defaults to HEIC, which cv::imdecode doesn't handle).
  // `qualityPrioritization: 'speed'` trims ~100-200ms off capture; the
  // VLM resizes the input anyway, so max quality is wasted.
  const photoOutput = usePhotoOutput({
    containerFormat: 'jpeg',
    qualityPrioritization: 'speed',
  });

  // Cleanup on unmount.
  const llmInterruptRef = useRef(llm.interrupt);
  const ttsStreamStopRef = useRef(tts.streamStop);
  const sttStreamStopRef = useRef(stt.streamStop);
  llmInterruptRef.current = llm.interrupt;
  ttsStreamStopRef.current = tts.streamStop;
  sttStreamStopRef.current = stt.streamStop;
  useEffect(() => {
    const recorder = recorderRef.current;
    return () => {
      try {
        recorder.stop();
      } catch {
        // not recording
      }
      try {
        sttStreamStopRef.current();
      } catch {
        // not streaming
      }
      try {
        llmInterruptRef.current();
      } catch {
        // not generating
      }
      try {
        ttsStreamStopRef.current(true);
      } catch {
        // not streaming
      }
    };
  }, []);

  // TTS consumer.
  const ttsStreamingRef = useRef(false);
  const ttsConsumerPromiseRef = useRef<Promise<void> | null>(null);
  const processedLenRef = useRef(0);

  const startTTSConsumer = useCallback(() => {
    if (ttsStreamingRef.current) return;
    const ctx = audioCtxRef.current;
    if (!ctx) {
      setError('Audio context not initialized');
      setScreenState('idle');
      return;
    }
    ttsStreamingRef.current = true;
    processedLenRef.current = 0;
    sawFirstTokenRef.current = false;
    sawFirstTTSInsertRef.current = false;
    let firstChunk = true;
    const consume = async () => {
      try {
        if (ctx.state === 'suspended') await ctx.resume();
        const onNext = (audioVec: Float32Array) =>
          new Promise<void>((resolve) => {
            const buf = makeAudioBuffer(audioVec, ctx, 24000);
            const src = ctx.createBufferSource();
            ttsSourceRef.current = src;
            src.buffer = buf;
            src.connect(ctx.destination);
            src.onEnded = () => resolve();
            src.start();
            if (firstChunk) {
              firstChunk = false;
              tlog('tts first audio playing');
              setScreenState((prev) =>
                prev === 'thinking' ? 'speaking' : prev
              );
            }
          });
        await tts.stream({ speed: 1.0, stopAutomatically: false, onNext });
      } catch (e) {
        console.error('[vlm_camera] tts error', e);
      } finally {
        ttsStreamingRef.current = false;
        if (ctx.state === 'running') await ctx.suspend();
      }
    };
    ttsConsumerPromiseRef.current = consume();
  }, [tts]);

  // Token producer.
  const sawFirstTokenRef = useRef(false);
  const sawFirstTTSInsertRef = useRef(false);
  useEffect(() => {
    if (!ttsStreamingRef.current) return;
    if (!llm.response) return;
    if (!sawFirstTokenRef.current) {
      sawFirstTokenRef.current = true;
      tlog('vlm first tokens');
    }
    const prev = processedLenRef.current;
    if (llm.response.length > prev) {
      const chunk = llm.response.slice(prev);
      try {
        tts.streamInsert(chunk);
        if (!sawFirstTTSInsertRef.current) {
          sawFirstTTSInsertRef.current = true;
          tlog('tts first streamInsert');
        }
      } catch {
        // ignore
      }
      processedLenRef.current = llm.response.length;
    }
  }, [llm.response, tts]);

  // On 'speaking', drain TTS once LLM generation is done.
  useEffect(() => {
    if (screenState !== 'speaking') return;
    let aborted = false;
    const drain = async () => {
      try {
        tts.streamStop(false);
      } catch {
        // not streaming
      }
      const promise = ttsConsumerPromiseRef.current;
      if (promise) {
        try {
          await promise;
        } catch {
          // ignored
        }
      }
      ttsConsumerPromiseRef.current = null;
      if (!aborted) setScreenState('idle');
    };
    void drain();
    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenState]);

  const startRecording = async () => {
    setError(null);
    setTranscript('');
    const sessionOk = await AudioManager.setAudioSessionActivity(true);
    if (!sessionOk) {
      setError('Could not activate audio session');
      return;
    }

    recorderRef.current.onAudioReady(
      {
        sampleRate: SAMPLE_RATE,
        bufferLength: 0.1 * SAMPLE_RATE,
        channelCount: 1,
      },
      ({ buffer }) => {
        if (!isRecordingRef.current) return;
        try {
          stt.streamInsert(buffer.getChannelData(0));
        } catch {
          // not streaming
        }
      }
    );

    const startResult = recorderRef.current.start();
    if (startResult.status === 'error') {
      setError(`Recording failed: ${startResult.message}`);
      return;
    }
    isRecordingRef.current = true;
    setScreenState('recording');
    __turnStart = Date.now();
    tlog('stt recording started');

    transcriptRef.current = '';
    setTranscript('');
    sttStreamPromiseRef.current = (async () => {
      try {
        let committedSoFar = '';
        for await (const { committed, nonCommitted } of stt.stream()) {
          if (committed.text) committedSoFar += committed.text;
          const live = (committedSoFar + (nonCommitted.text ?? '')).trim();
          transcriptRef.current = live;
          setTranscript(live);
          if (!isRecordingRef.current) break;
        }
      } catch (e) {
        console.error('[vlm_camera] stt stream error', e);
      }
    })();
  };

  const onMicPress = async () => {
    if (screenState === 'idle') {
      if (sttPreventLoad) setSttPreventLoad(false);
      await startRecording();
      return;
    }
    if (screenState === 'recording') {
      setScreenState('transcribing');
      tlog('stt stop signalled');
      try {
        isRecordingRef.current = false;
        try {
          recorderRef.current.stop();
        } catch {
          // not recording
        }
        try {
          stt.streamStop();
        } catch {
          // not streaming
        }
        const draining = sttStreamPromiseRef.current;
        sttStreamPromiseRef.current = null;
        if (draining) {
          draining
            .catch(() => {
              /* ignored */
            })
            .then(() => {
              tlog('stt drained (background), unloading whisper');
              setSttPreventLoad(true);
            });
        } else {
          setSttPreventLoad(true);
        }

        const finalText = transcriptRef.current.trim();
        tlog('stt final transcript:', finalText);
        if (!finalText) {
          setError("Didn't catch that, try again");
          setScreenState('idle');
          return;
        }

        // One-shot capture: write the JPEG to a temp file and hand the
        // file:// path to the LLM. Skips JS-thread base64 encoding (was
        // ~400ms) in favor of a tiny native disk write (~50ms).
        tlog('capturePhoto start');
        const photo = await photoOutput.capturePhoto({}, {});
        tlog('capturePhoto done');
        const tempPath = await photo.saveToTemporaryFileAsync();
        tlog('photo saved to temp file', tempPath);
        photo.dispose();
        const dataUri = tempPath.startsWith('file://')
          ? tempPath
          : `file://${tempPath}`;

        setScreenState('thinking');
        startTTSConsumer();
        tlog('vlm submit (sendMessage)');
        // Clear conversation history each turn so previous image tokens
        // don't leak (the JS-side state isn't strictly load-bearing
        // because the native runner resets every call, but a tidy
        // history simplifies follow-up flows).
        try {
          llm.deleteMessage(0);
        } catch {
          // best effort
        }
        llm
          .sendMessage(finalText, { imagePath: dataUri })
          .catch((e) => {
            console.error('[vlm_camera] sendMessage error', e);
            setError(e instanceof Error ? e.message : String(e));
            setScreenState('idle');
          })
          .finally(() => {
            // Best-effort cleanup of the temp JPEG.
            FileSystem.deleteAsync(dataUri, { idempotent: true }).catch(
              () => undefined
            );
          });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setScreenState('idle');
      }
      return;
    }
    if (screenState === 'thinking' || screenState === 'speaking') {
      try {
        llm.interrupt();
      } catch {
        // not running
      }
      try {
        tts.streamStop(true);
      } catch {
        // not streaming
      }
      try {
        ttsSourceRef.current?.stop();
      } catch {
        // already ended
      }
      setScreenState('idle');
    }
  };

  if (!cameraPermission.hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Camera access needed</Text>
        <TouchableOpacity
          onPress={() => cameraPermission.requestPermission()}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
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
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused}
        outputs={[photoOutput]}
        onError={(e) => setError(e.message)}
      />

      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 8 }]}
        onPress={() => router.navigate('/')}
      >
        <Ionicons name="chevron-back" size={24} color="white" />
      </TouchableOpacity>

      <View
        style={[styles.statusContainer, { top: insets.top + 8 }]}
        pointerEvents="none"
      >
        <StatusPill state={screenState} />
      </View>

      {transcript && screenState !== 'idle' && (
        <View
          style={[styles.transcriptOverlay, { top: insets.top + 64 }]}
          pointerEvents="none"
        >
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      )}

      <View
        style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 24 }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[
            styles.fab,
            (screenState === 'recording' ||
              screenState === 'thinking' ||
              screenState === 'speaking') &&
              styles.fabRecording,
            (!allReady || !hasMicPermission) && styles.fabDisabled,
          ]}
          disabled={
            !allReady || !hasMicPermission || screenState === 'transcribing'
          }
          onPress={onMicPress}
        >
          <Ionicons
            name={
              screenState === 'recording' ||
              screenState === 'thinking' ||
              screenState === 'speaking'
                ? 'stop'
                : 'mic'
            }
            size={32}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={[styles.errorBar, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!allReady && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>
            Loading models… {(avgProgress * 100).toFixed(0)}%
          </Text>
        </View>
      )}
    </View>
  );
}

function StatusPill({ state }: { state: ScreenState }) {
  if (state === 'idle') return null;

  const config = (() => {
    switch (state) {
      case 'recording':
        return {
          label: 'Listening',
          color: '#ff4444',
          indicator: 'pulse' as const,
        };
      case 'transcribing':
        return {
          label: 'Transcribing',
          color: '#ffaa33',
          indicator: 'dots' as const,
        };
      case 'thinking':
        return {
          label: 'Thinking',
          color: '#5599ff',
          indicator: 'dots' as const,
        };
      case 'speaking':
        return {
          label: 'Speaking',
          color: '#33cc88',
          indicator: 'wave' as const,
        };
      default:
        return null;
    }
  })();

  if (!config) return null;

  return (
    <View style={styles.statusPill}>
      <Indicator type={config.indicator} color={config.color} />
      <Text style={styles.statusLabel}>{config.label}</Text>
    </View>
  );
}

function Indicator({
  type,
  color,
}: {
  type: 'pulse' | 'dots' | 'wave';
  color: string;
}) {
  if (type === 'pulse') return <PulseDot color={color} />;
  if (type === 'dots') return <BouncingDots color={color} />;
  return <Wave color={color} />;
}

function PulseDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.4,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);
  return (
    <Animated.View
      style={[
        styles.pulseDot,
        { backgroundColor: color, transform: [{ scale }] },
      ]}
    />
  );
}

function BouncingDots({ color }: { color: string }) {
  return (
    <View style={styles.dotsRow}>
      <BouncingDot color={color} delay={0} />
      <BouncingDot color={color} delay={150} />
      <BouncingDot color={color} delay={300} />
    </View>
  );
}

function BouncingDot({ color, delay }: { color: string; delay: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateY, {
          toValue: -4,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [translateY, delay]);
  return (
    <Animated.View
      style={[
        styles.bouncingDot,
        { backgroundColor: color, transform: [{ translateY }] },
      ]}
    />
  );
}

function Wave({ color }: { color: string }) {
  return (
    <View style={styles.waveRow}>
      <WaveBar color={color} delay={0} />
      <WaveBar color={color} delay={100} />
      <WaveBar color={color} delay={200} />
      <WaveBar color={color} delay={300} />
    </View>
  );
}

function WaveBar({ color, delay }: { color: string; delay: number }) {
  const scaleY = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(scaleY, {
          toValue: 1,
          duration: 250,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleY, {
          toValue: 0.4,
          duration: 250,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scaleY, delay]);
  return (
    <Animated.View
      style={[
        styles.waveBar,
        { backgroundColor: color, transform: [{ scaleY }] },
      ]}
    />
  );
}

function makeAudioBuffer(
  audioVec: Float32Array,
  ctx: AudioContext,
  sampleRate = 24000
): AudioBuffer {
  const buf = ctx.createBuffer(1, audioVec.length, sampleRate);
  buf.getChannelData(0).set(audioVec);
  return buf;
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
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: ColorPalette.primary,
    borderRadius: 24,
  },
  permissionButtonText: { color: 'white', fontSize: 15, fontWeight: '600' },
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
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  fab: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ColorPalette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  fabDisabled: { opacity: 0.4 },
  fabRecording: { backgroundColor: '#cc2222' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loadingText: { color: 'white', fontSize: 18, fontWeight: '600' },
  errorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(180,0,0,0.85)',
    zIndex: 50,
  },
  errorText: { color: 'white', fontSize: 14 },
  statusContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.65)',
    gap: 10,
    minHeight: 36,
  },
  statusLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 12,
  },
  bouncingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 14,
  },
  waveBar: {
    width: 3,
    height: 14,
    borderRadius: 1.5,
  },
  transcriptOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    zIndex: 5,
  },
  transcriptText: {
    color: 'white',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
