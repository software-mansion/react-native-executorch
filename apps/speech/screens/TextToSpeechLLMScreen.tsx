import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import SWMIcon from '../assets/swm_icon.svg';
import {
  useLLM,
  useTextToSpeech,
  KOKORO_MEDIUM,
  KOKORO_VOICE_AF_HEART,
  LLAMA3_2_1B_QLORA,
} from 'react-native-executorch';
import {
  AudioManager,
  AudioContext,
  AudioBuffer,
  AudioBufferSourceNode,
} from 'react-native-audio-api';

interface TextToSpeechLLMProps {
  onBack: () => void;
}

/**
 * Converts an audio vector (Float32Array) to an AudioBuffer for playback
 * @param audioVector - The generated audio samples from the model
 * @param audioContext - The audio context used to create the buffer.
 * @param sampleRate - The sample rate (default: 24000 Hz for Kokoro)
 * @returns AudioBuffer ready for playback
 */
const createAudioBufferFromVector = (
  audioVector: Float32Array,
  audioContext: AudioContext,
  sampleRate: number = 24000
): AudioBuffer => {
  const audioBuffer = audioContext.createBuffer(
    1,
    audioVector.length,
    sampleRate
  );
  const channelData = audioBuffer.getChannelData(0);
  channelData.set(audioVector);

  return audioBuffer;
};

export const TextToSpeechLLMScreen = ({ onBack }: TextToSpeechLLMProps) => {
  const [displayText, setDisplayText] = useState('');
  const [isTtsStreaming, setIsTtsStreaming] = useState(false);
  const llm = useLLM({ model: LLAMA3_2_1B_QLORA });
  const tts = useTextToSpeech({
    model: KOKORO_MEDIUM,
    voice: KOKORO_VOICE_AF_HEART,
  });

  const processedLengthRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode>(null);

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['defaultToSpeaker'],
    });

    audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current.suspend();

    return () => {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  // Update displayText gradually as response gets generated and insert new text chunks into TTS stream
  useEffect(() => {
    if (llm.response && tts.isReady) {
      setDisplayText(llm.response);

      const previousLength = processedLengthRef.current;
      if (llm.response.length > previousLength && isTtsStreaming) {
        const newChunk = llm.response.slice(previousLength);
        tts.streamInsert(newChunk);
        processedLengthRef.current = llm.response.length;
      }
    } else {
      processedLengthRef.current = 0;
    }
  }, [llm.response, tts, isTtsStreaming]);

  const handleGenerate = async () => {
    setDisplayText('');
    processedLengthRef.current = 0;
    setIsTtsStreaming(true);

    const startTTS = async () => {
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

        await tts.stream({
          speed: 0.9,
          stopAutomatically: false,
          onNext,
        });
      } catch (e) {
        console.error('TTS streaming error:', e);
      } finally {
        setIsTtsStreaming(false);
      }
    };

    const ttsPromise = startTTS();

    try {
      await llm.sendMessage(
        'Generate a short story about a robot learning to paint. The story should be around 200 words long.'
      );
    } catch (e) {
      console.error('Generation failed:', e);
    } finally {
      tts.streamStop(false);
      await ttsPromise;

      if (
        audioContextRef.current &&
        audioContextRef.current.state === 'running'
      ) {
        await audioContextRef.current.suspend();
      }
    }
  };

  const handleStop = () => {
    llm.interrupt();
    tts.streamStop(true);
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {
        // Source might have already stopped or disconnected
      }
    }
  };

  const isProcessing = llm.isGenerating || isTtsStreaming;
  const isModelsReady = llm.isReady && tts.isReady;

  const getModelStatus = () => {
    if (llm.error) return `LLM Error: ${llm.error.message}`;
    if (tts.error) return `TTS Error: ${tts.error.message}`;
    if (!llm.isReady)
      return `Loading LLM: ${(100 * llm.downloadProgress).toFixed(2)}%`;
    if (!tts.isReady)
      return `Loading TTS: ${(100 * tts.downloadProgress).toFixed(2)}%`;
    if (isProcessing) return 'Generating/Streaming...';
    return 'Ready';
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <FontAwesome name="chevron-left" size={20} color="#0f186e" />
          </TouchableOpacity>
          <SWMIcon width={60} height={60} />
          <Text style={styles.headerText}>React Native ExecuTorch</Text>
          <Text style={styles.headerText}>LLM to Speech Demo</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text>Status: {getModelStatus()}</Text>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.label}>Generated Story</Text>
          <View style={styles.responseContainer}>
            <ScrollView contentContainerStyle={styles.responseContent}>
              <Text style={styles.responseText}>
                {displayText ||
                  (isModelsReady
                    ? 'Press the button to generate a story and hear it spoken aloud.'
                    : 'Please wait for models to load...')}
              </Text>
            </ScrollView>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {isProcessing ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.stopButton]}
              onPress={handleStop}
            >
              <FontAwesome name="stop" size={20} color="white" />
              <Text style={styles.buttonText}>Stop Generation</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              disabled={!isModelsReady}
              onPress={handleGenerate}
              style={[styles.actionButton, !isModelsReady && styles.disabled]}
            >
              <FontAwesome name="magic" size={20} color="white" />
              <Text style={styles.buttonText}>Generate & Stream Speech</Text>
            </TouchableOpacity>
          )}
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
  contentContainer: {
    width: '100%',
    marginTop: 24,
    flex: 1,
    marginBottom: 24,
  },
  label: {
    marginLeft: 12,
    marginBottom: 4,
    color: '#0f186e',
    fontWeight: '600',
  },
  responseContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f186e',
    flex: 1,
  },
  responseContent: {
    padding: 12,
  },
  responseText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  buttonContainer: {
    marginBottom: 24,
    width: '100%',
  },
  actionButton: {
    backgroundColor: '#0f186e',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  stopButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    letterSpacing: -0.5,
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
});
