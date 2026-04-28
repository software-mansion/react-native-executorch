import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useSpeechToText,
  WHISPER_TINY_EN,
  useTextToSpeech,
  KOKORO,
  KOKORO_VOICE_AMERICAN_ENGLISH_FEMALE_HEART,
  useLLM,
  LFM2_5_1_2B_INSTRUCT_QUANTIZED,
} from 'react-native-executorch';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  AudioManager,
  AudioRecorder,
  AudioContext,
  AudioBuffer,
  AudioBufferSourceNode,
} from 'react-native-audio-api';
import SWMIcon from '../assets/swm_icon.svg';
import DeviceInfo from 'react-native-device-info';
import ErrorBanner from '../components/ErrorBanner';

const isSimulator = DeviceInfo.isEmulatorSync();

const createAudioBufferFromVector = (
  audioVector: Float32Array,
  audioContext: AudioContext | null = null,
  sampleRate: number = 24000
): AudioBuffer => {
  if (audioContext == null) audioContext = new AudioContext({ sampleRate });

  const audioBuffer = audioContext.createBuffer(
    1,
    audioVector.length,
    sampleRate
  );
  const channelData = audioBuffer.getChannelData(0);
  channelData.set(audioVector);

  return audioBuffer;
};

export const SpeechToSpeechScreen = ({ onBack }: { onBack: () => void }) => {
  // STT Setup
  const sttModel = useSpeechToText({
    model: WHISPER_TINY_EN,
  });

  // TTS Setup
  const ttsModel = useTextToSpeech({
    model: KOKORO,
    voice: KOKORO_VOICE_AMERICAN_ENGLISH_FEMALE_HEART,
  });

  // LLM Setup
  const llm = useLLM({
    model: LFM2_5_1_2B_INSTRUCT_QUANTIZED,
  });

  useEffect(() => {
    if (llm.isReady) {
      llm.configure({
        chatConfig: {
          systemPrompt:
            'You are a precise voice assistant. Give very short, concise answers. Avoid long explanations.',
        },
      });
    }
  }, [llm.isReady, llm]);

  const [, setSttResult] = useState<string | null>(null);
  const [liveSttResult, setLiveSttResult] = useState<string>('');
  const [assistantResponse, setAssistantResponse] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState(false);

  const recorder = useRef(new AudioRecorder());
  const isRecordingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode>(null);
  const scrollViewRef = useRef<ScrollView>(null);

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
      audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  const handleStartRecording = async () => {
    if (!hasMicPermission) {
      setError('Microphone permission denied. Please enable it in Settings.');
      return;
    }

    if (!sttModel.isReady || !ttsModel.isReady) {
      return;
    }

    isRecordingRef.current = true;
    setIsRecording(true);
    setSttResult(null);
    setLiveSttResult('');
    setAssistantResponse('');
    llm.interrupt();

    const sampleRate = 16000;
    sttModel.streamStop(); // Ensure previous session is cleared
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
  };

  const handleStopRecording = async () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    recorder.current.stop();
    sttModel.streamStop();
    llm.configure({
      chatConfig: {
        systemPrompt:
          'You are a precise voice assistant. Give very short, concise answers. Avoid long explanations.',
      },
    });

    if (liveSttResult.trim()) {
      const cleanedText = deduplicateTranscription(liveSttResult);
      setSttResult(cleanedText);

      try {
        // Core Logic: Send STT text to LLM and then speak the LLM response
        const response = await llm.sendMessage(cleanedText);
        if (response) {
          setAssistantResponse(response);
          handlePlayTts(response);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    }
  };

  /**
   * Simple heuristic to deduplicate common hallucinations or repeated phrases in STT.
   * Cleans up cases like "Hello world. Hello world." or repeated segments.
   * @param text Original transcription text.
   */
  const deduplicateTranscription = (text: string): string => {
    if (!text) return '';

    // Split into sentences/fragments
    const fragments = text
      .split(/([.!?]+|\n)/)
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const uniqueFragments: string[] = [];
    for (let i = 0; i < fragments.length; i++) {
      const fragment = fragments[i];
      // Skip if it is just punctuation
      if (/^[.!?\n]+$/.test(fragment)) {
        if (uniqueFragments.length > 0) {
          uniqueFragments[uniqueFragments.length - 1] += fragment;
        }
        continue;
      }

      // Check if this fragment (normalized) was recently added
      const normalizedCurrent = fragment
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
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

  const handlePlayTts = async (text: string) => {
    if (isTtsPlaying) return;
    setIsTtsPlaying(true);

    try {
      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const onNext = async (audioVec: Float32Array) => {
        return new Promise<void>((resolve) => {
          const audioBuffer = createAudioBufferFromVector(
            audioVec,
            audioContext,
            24000
          );
          const source = (sourceRef.current =
            audioContext.createBufferSource());
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.onEnded = () => resolve();
          source.start();
        });
      };

      const onEnd = async () => {
        setIsTtsPlaying(false);
        await audioContext.suspend();
      };

      await ttsModel.stream({
        text,
        onNext,
        onEnd,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setIsTtsPlaying(false);
    }
  };

  const getStatusText = () => {
    if (!sttModel.isReady)
      return `Loading STT: ${(100 * sttModel.downloadProgress).toFixed(2)}%`;
    if (!llm.isReady)
      return `Loading LLM: ${(100 * llm.downloadProgress).toFixed(2)}%`;
    if (!ttsModel.isReady)
      return `Loading TTS: ${(100 * ttsModel.downloadProgress).toFixed(2)}%`;
    if (isRecording) return 'Listening...';
    if (sttModel.isGenerating) return 'Processing Speech...';
    if (llm.isGenerating) return 'Thinking...';
    if (ttsModel.isGenerating) return 'Synthesizing Speech...';
    if (isTtsPlaying) return 'Speaking...';
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
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <FontAwesome name="chevron-left" size={20} color="#0f186e" />
          </TouchableOpacity>
          <SWMIcon width={60} height={60} />
          <Text style={styles.headerText}>React Native ExecuTorch</Text>
          <Text style={styles.headerText}>Speech to Speech</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text>Status: {getStatusText()}</Text>
        </View>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <View style={styles.transcriptionContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.transcriptionScrollContainer}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {assistantResponse || llm.response ? (
              <View style={styles.llmResponseContainer}>
                <Text style={styles.llmResponseText}>
                  {assistantResponse || llm.response}
                </Text>
              </View>
            ) : (
              <Text style={styles.placeholderText}>
                {isRecording
                  ? 'Listening...'
                  : 'Press the microphone to start talking.'}
              </Text>
            )}
          </ScrollView>
        </View>

        <View style={styles.controlsContainer}>
          {isRecording ? (
            <TouchableOpacity
              onPress={handleStopRecording}
              style={[styles.micButton, styles.backgroundRed]}
            >
              <FontAwesome name="microphone-slash" size={32} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              disabled={recordingButtonDisabled}
              onPress={handleStartRecording}
              style={[
                styles.micButton,
                styles.backgroundBlue,
                recordingButtonDisabled && styles.disabled,
              ]}
            >
              <FontAwesome name="microphone" size={32} color="white" />
            </TouchableOpacity>
          )}
          <Text style={styles.helperText}>
            {isSimulator
              ? 'Microphone not available on Simulator'
              : isRecording
                ? 'Tap to stop'
                : 'Tap to speak'}
          </Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 10,
    padding: 10,
    zIndex: 1,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f186e',
  },
  statusContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  transcriptionContainer: {
    flex: 1,
    width: '100%',
    marginVertical: 24,
  },
  transcriptionLabel: {
    marginLeft: 12,
    marginBottom: 4,
    color: '#0f186e',
    fontWeight: '600',
  },
  transcriptionScrollContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f186e',
    padding: 12,
  },
  placeholderText: {
    color: '#aaa',
    fontStyle: 'italic',
  },
  controlsContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backgroundRed: {
    backgroundColor: 'red',
  },
  backgroundBlue: {
    backgroundColor: '#0f186e',
  },
  disabled: {
    opacity: 0.5,
  },
  helperText: {
    marginTop: 12,
    color: '#0f186e',
    fontSize: 16,
    fontWeight: '500',
  },
  llmResponseContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  llmResponseLabel: {
    fontWeight: 'bold',
    color: '#0f186e',
    marginBottom: 4,
  },
  llmResponseText: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 22,
  },
});
