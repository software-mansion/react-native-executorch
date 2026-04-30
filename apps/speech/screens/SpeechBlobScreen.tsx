import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  AudioContext,
  AudioManager,
  AudioBufferSourceNode,
  AudioRecorder,
} from 'react-native-audio-api';
import {
  KOKORO,
  KOKORO_VOICE_AMERICAN_ENGLISH_FEMALE_HEART,
  LFM2_5_1_2B_INSTRUCT_QUANTIZED,
  useLLM,
  useSpeechToText,
  useTextToSpeech,
  WHISPER_TINY_EN,
} from 'react-native-executorch';
import DeviceInfo from 'react-native-device-info';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Settings, Mic, ChevronLeft } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SWMIcon from '../assets/swm_icon.svg';
import { bubbleData } from '../assets/data/bubblePresets';
import { BubbleData } from '../assets/types/bubbleTypes';
import Equaliser from '../components/Equaliser';
import EqualiserOptionsModal from '../components/EqualiserOptionsModal';

const isSimulator = DeviceInfo.isEmulatorSync();

const createAudioBufferFromVector = (
  audioVector: Float32Array,
  audioContext: AudioContext,
  sampleRate: number = 24000
) => {
  const audioBuffer = audioContext.createBuffer(
    1,
    audioVector.length,
    sampleRate
  );
  const channelData = audioBuffer.getChannelData(0);
  channelData.set(audioVector);
  return audioBuffer;
};

const rms = (frame: Float32Array) => {
  let sum = 0;
  for (let i = 0; i < frame.length; i += 1) sum += frame[i] * frame[i];
  return Math.sqrt(sum / frame.length);
};

const deduplicateTranscription = (text: string): string => {
  if (!text) return '';

  const fragments = text
    .split(/([.!?]+|\n)/)
    .map((fragment) => fragment.trim())
    .filter((fragment) => fragment.length > 0);

  const uniqueFragments: string[] = [];
  for (let i = 0; i < fragments.length; i += 1) {
    const fragment = fragments[i];
    if (/^[.!?\n]+$/.test(fragment)) {
      if (uniqueFragments.length > 0) {
        uniqueFragments[uniqueFragments.length - 1] += fragment;
      }
      continue;
    }

    const normalizedCurrent = fragment.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isDuplicate = uniqueFragments.some((prev) => {
      const normalizedPrev = prev.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normalizedPrev === normalizedCurrent;
    });

    if (!isDuplicate) {
      uniqueFragments.push(fragment);
    }
  }

  return uniqueFragments.join(' ');
};

export const SpeechBlobScreen = ({ onBack }: { onBack: () => void }) => {
  const sttModel = useSpeechToText({ model: WHISPER_TINY_EN });
  const ttsModel = useTextToSpeech({
    model: KOKORO,
    voice: KOKORO_VOICE_AMERICAN_ENGLISH_FEMALE_HEART,
  });
  const llm = useLLM({ model: LFM2_5_1_2B_INSTRUCT_QUANTIZED });

  const [liveSttResult, setLiveSttResult] = useState('');
  const [processedText, setProcessedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [optionsAreOpened, setOptionsAreOpened] = useState(false);

  const recorder = useRef(new AudioRecorder());
  const isRecordingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const equaliserData = useRef<BubbleData>({ ...bubbleData[0] });
  const volume = useRef(0.0);

  // Gradual state transitions for the blob
  useEffect(() => {
    const baseData = bubbleData[0];
    const lerp = (start: number, end: number, t: number) =>
      start + (end - start) * t;
    const lerpVec3 = (
      start: number[],
      end: number[],
      t: number
    ): [number, number, number] => [
      lerp(start[0], end[0], t),
      lerp(start[1], end[1], t),
      lerp(start[2], end[2], t),
    ];

    let frameId: number;
    const duration = 800; // ms
    const startTime = Date.now();
    const startData = { ...equaliserData.current };

    // Define target values based on state
    const targetColors = {
      colorOne: baseData.colors.colorOne.value as number[],
    };
    const targetNoise = {
      shiftVector: baseData.noise.shiftVector.value as number[],
      scale: baseData.noise.scale.value as number,
    };
    const targetSphere = {
      sphereNoiseMultiplier: baseData.sphere.sphereNoiseMultiplier
        .value as number,
    };

    if (isRecording) {
      targetColors.colorOne = [0.6, 0.1, 0.1];
      targetNoise.scale = 0.2; // Reduced from 2.0 (closer to base 0.7)
      targetSphere.sphereNoiseMultiplier = 0.5; // Reduced 2x (closer to base)
    } else if (llm.isGenerating || ttsModel.isGenerating) {
      // targetNoise.shiftVector = [0.013, 0.010, 0.012];
      targetColors.colorOne = [0.0, 0.0, 0.6];
    } else if (isTtsPlaying) {
      targetColors.colorOne = [0.1, 0.2, 0.6];
    }

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      const currentData = { ...equaliserData.current };
      currentData.colors = {
        ...currentData.colors,
        colorOne: {
          ...currentData.colors.colorOne,
          value: lerpVec3(
            startData.colors.colorOne.value as number[],
            targetColors.colorOne,
            ease
          ),
        },
      };
      currentData.noise = {
        ...currentData.noise,
        shiftVector: {
          ...currentData.noise.shiftVector,
          value: lerpVec3(
            startData.noise.shiftVector.value as number[],
            targetNoise.shiftVector,
            ease
          ),
        },
        scale: {
          ...currentData.noise.scale,
          value: lerp(
            startData.noise.scale.value as number,
            targetNoise.scale,
            ease
          ),
        },
      };
      currentData.sphere = {
        ...currentData.sphere,
        sphereNoiseMultiplier: {
          ...currentData.sphere.sphereNoiseMultiplier,
          value: lerp(
            startData.sphere.sphereNoiseMultiplier.value as number,
            targetSphere.sphereNoiseMultiplier,
            ease
          ),
        },
      };

      equaliserData.current = currentData;

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isRecording, llm.isGenerating, ttsModel.isGenerating, isTtsPlaying]);

  useEffect(() => {
    if (!llm.isReady) return;
    llm.configure({
      chatConfig: {
        systemPrompt:
          'You are a precise voice assistant. Give very short, concise answers. Avoid long explanations.',
      },
    });
  }, [llm.isReady, llm]);

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetoothHFP', 'defaultToSpeaker'],
    });

    const checkPerms = async () => {
      const status = await AudioManager.requestRecordingPermissions();
      setHasMicPermission(status === 'Granted');
    };
    checkPerms();

    audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current.suspend();

    return () => {
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch (e) {
          // Source may have already stopped.
        }
      }
      audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  const handlePlayTts = useCallback(
    async (text: string) => {
      if (isTtsPlaying) return;
      setIsTtsPlaying(true);

      try {
        const audioContext = audioContextRef.current;
        if (!audioContext) return;

        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        await ttsModel.stream({
          text,
          onNext: async (audioVec: Float32Array) => {
            return new Promise<void>((resolve) => {
              const audioBuffer = createAudioBufferFromVector(
                audioVec,
                audioContext,
                24000
              );

              sourceRef.current = audioContext.createBufferSource();
              const source = sourceRef.current;
              source.buffer = audioBuffer;
              source.connect(audioContext.destination);

              source.onEnded = () => {
                if (sourceRef.current === source) {
                  sourceRef.current = null;
                }
                resolve();
              };
              source.start();

              const subChunkSize = 512;
              for (let i = 0; i < audioVec.length; i += subChunkSize) {
                const offset = i;
                setTimeout(
                  () => {
                    const subChunk = audioVec.slice(
                      offset,
                      offset + subChunkSize
                    );
                    volume.current = rms(subChunk);
                  },
                  (i / 24000) * 1000
                );
              }
            });
          },
          onEnd: async () => {
            setIsTtsPlaying(false);
            volume.current = 0.0;
            if (audioContextRef.current) {
              await audioContextRef.current.suspend();
            }
          },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setIsTtsPlaying(false);
        volume.current = 0.0;
      }
    },
    [isTtsPlaying, ttsModel]
  );

  const startRecording = useCallback(async () => {
    if (!hasMicPermission) {
      setError('Microphone permission denied. Please enable it in Settings.');
      return;
    }

    if (!sttModel.isReady || !ttsModel.isReady || !llm.isReady) {
      return;
    }

    isRecordingRef.current = true;
    setIsRecording(true);
    setLiveSttResult('');
    setProcessedText('');

    const sampleRate = 16000;
    sttModel.streamStop();
    recorder.current.onAudioReady(
      { sampleRate, bufferLength: 0.1 * sampleRate, channelCount: 1 },
      ({ buffer }) => {
        sttModel.streamInsert(buffer.getChannelData(0));
      }
    );

    try {
      await AudioManager.setAudioSessionActivity(true);
      recorder.current.start();

      let accumulatedText = '';
      const streamIter = sttModel.stream({ verbose: false });

      for await (const { committed, nonCommitted } of streamIter) {
        if (!isRecordingRef.current) break;
        if (committed.text) {
          accumulatedText += committed.text;
        }
        setLiveSttResult(accumulatedText + nonCommitted.text);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  }, [hasMicPermission, sttModel, ttsModel, llm.isReady]);

  const stopRecording = useCallback(async () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    recorder.current.stop();
    sttModel.streamStop();

    if (liveSttResult.trim()) {
      const cleanedText = deduplicateTranscription(liveSttResult);
      try {
        llm.interrupt();
        const response = await llm.sendMessage(cleanedText);
        if (response) {
          setProcessedText(response);
          await handlePlayTts(response);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    }
  }, [liveSttResult, sttModel, llm, handlePlayTts]);

  const getStatusText = () => {
    if (sttModel.error) return `STT Error: ${sttModel.error}`;
    if (ttsModel.error) return `TTS Error: ${ttsModel.error}`;
    if (llm.error) return `LLM Error: ${llm.error.message}`;
    if (!sttModel.isReady)
      return `Loading STT: ${(100 * sttModel.downloadProgress).toFixed(2)}%`;
    if (!ttsModel.isReady)
      return `Loading TTS: ${(100 * ttsModel.downloadProgress).toFixed(2)}%`;
    if (!llm.isReady)
      return `Loading LLM: ${(100 * llm.downloadProgress).toFixed(2)}%`;
    if (isRecording) return 'Listening...';
    if (llm.isGenerating) return 'Thinking...';
    if (ttsModel.isGenerating) return 'Synthesizing...';
    if (isTtsPlaying) return 'Playing...';
    return 'Ready';
  };

  const recordingButtonDisabled =
    isSimulator ||
    !sttModel.isReady ||
    !ttsModel.isReady ||
    !llm.isReady ||
    isTtsPlaying ||
    llm.isGenerating;

  return (
    <GestureHandlerRootView style={styles.rootContainer}>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <SafeAreaView style={styles.mainContainer}>
            <View style={styles.topContainer}>
              <View style={styles.navContainer}>
                <View style={styles.leftNav}>
                  <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <ChevronLeft size={30} color="#071576" />
                  </TouchableOpacity>
                  <TouchableOpacity onLongPress={onBack}>
                    <SWMIcon width={72} height={60} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => setOptionsAreOpened(true)}>
                  <Settings size={30} color="#071576" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.transcriptionContainer}>
              <View style={styles.statusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    (isRecording ||
                      llm.isGenerating ||
                      ttsModel.isGenerating ||
                      isTtsPlaying) &&
                      styles.statusDotActive,
                  ]}
                />
                <Text style={styles.statusText}>{getStatusText()}</Text>
              </View>
            </View>
            <View style={styles.iconsContainer}>
              <View
                style={[
                  styles.recordingButtonWrapper,
                  recordingButtonDisabled && styles.borderGrey,
                  isRecording && styles.borderRed,
                ]}
              >
                {isRecording ? (
                  <TouchableOpacity
                    onPress={stopRecording}
                    style={[styles.recordingButton, styles.backgroundRed]}
                  >
                    <Text style={styles.recordingButtonText}>LISTENING...</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    disabled={recordingButtonDisabled}
                    onPress={startRecording}
                    style={[
                      styles.recordingButton,
                      recordingButtonDisabled && styles.backgroundGrey,
                    ]}
                  >
                    {recordingButtonDisabled ? (
                      <Text style={styles.recordingButtonText}>LOADING...</Text>
                    ) : (
                      <Mic size={36} color="white" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </SafeAreaView>

          <View style={styles.shaderContainer}>
            {equaliserData.current && (
              <Equaliser
                volume={volume}
                width={styles.shaderContainer.width}
                height={styles.shaderContainer.height}
                equaliserData={equaliserData}
              />
            )}
          </View>

          {optionsAreOpened ? (
            <EqualiserOptionsModal
              isVisible={optionsAreOpened}
              onClose={() => setOptionsAreOpened(false)}
              equaliserData={equaliserData}
            />
          ) : null}
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  recordingButtonWrapper: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    borderWidth: 2,
    borderColor: '#071576',
    borderRadius: 48,
    shadowColor: '#071576',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  topContainer: {
    marginTop: 50,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transcriptionContainer: {
    flex: 7,
    paddingTop: 10,
    width: '90%',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(7, 21, 118, 0.1)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: '#071576',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#071576',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconsContainer: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '60%',
  },
  recordingButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  textGreyCenter: {
    color: 'gray',
    textAlign: 'center',
  },
  borderGrey: {
    borderColor: 'grey',
  },
  backgroundGrey: {
    backgroundColor: 'grey',
  },
  font13: {
    fontSize: 13,
  },
  borderRed: {
    borderColor: 'rgb(240, 63, 50)',
  },
  backgroundRed: {
    backgroundColor: 'rgb(240, 63, 50)',
  },
  backgroundBlue: {
    backgroundColor: '#001A72',
  },
  disabled: {
    opacity: 0.5,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  leftNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 8,
  },
  recordingButton: {
    width: 84,
    height: 84,
    backgroundColor: '#071576',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 42,
  },
  shaderContainer: {
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
    backgroundColor: 'transparent',
  },
});
