import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  KOKORO_EN,
  KOKORO_VOICE_AF_HEART,
  useTextToSpeech,
} from 'react-native-executorch';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  AudioManager,
  AudioContext,
  AudioBuffer,
  AudioBufferSourceNode,
} from 'react-native-audio-api';
import SWMIcon from '../assets/swm_icon.svg';

/**
 * Converts an audio vector (Float32Array) to an AudioBuffer for playback
 * @param audioVector - The generated audio samples from the model
 * @param sampleRate - The sample rate (default: 24000 Hz for Kokoro)
 * @returns AudioBuffer ready for playback
 */
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

export const TextToSpeechScreen = ({ onBack }: { onBack: () => void }) => {
  const model = useTextToSpeech({
    model: KOKORO_EN,
    voice: KOKORO_VOICE_AF_HEART,
    options: {
      // This allows to minimize the memory usage by utilizing only one of the models.
      // However, it either increases the latency (in case of the largest model) or
      // decreases the quality of the results (in case of the smaller models).
      // fixedModel: "large"
    },
  });

  const [inputText, setInputText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);

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

  useEffect(() => {
    setReadyToGenerate(!model.isGenerating && model.isReady && !isPlaying);
  }, [model.isGenerating, model.isReady, isPlaying]);

  const handlePlayAudio = async () => {
    if (!inputText.trim()) {
      return;
    }

    setIsPlaying(true);

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
        setIsPlaying(false);
        await audioContext.suspend();
      };

      await model.stream({
        text: inputText,
        onNext,
        onEnd,
      });
    } catch (error) {
      console.error('Error generating or playing audio:', error);
      setIsPlaying(false);
    }
  };

  const getModelStatus = () => {
    if (model.error) return `${model.error}`;
    if (model.isGenerating) return 'Generating audio...';
    if (model.isReady) return 'Ready to synthesize';
    return `Loading model: ${(100 * model.downloadProgress).toFixed(2)}%`;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <FontAwesome name="chevron-left" size={20} color="#0f186e" />
            </TouchableOpacity>
            <SWMIcon width={60} height={60} />
            <Text style={styles.headerText}>React Native ExecuTorch</Text>
            <Text style={styles.headerText}>Text to Speech</Text>
          </View>

          <View style={styles.statusContainer}>
            <Text>Status: {getModelStatus()}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Enter text to synthesize</Text>
            <TextInput
              placeholder="Type something..."
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              disabled={!readyToGenerate}
              onPress={handlePlayAudio}
              style={[styles.playButton, !readyToGenerate && styles.disabled]}
            >
              <FontAwesome
                name={isPlaying ? 'volume-up' : 'play'}
                size={20}
                color="white"
              />
              <Text style={styles.buttonText}>
                {isPlaying ? 'Playing...' : 'Generate & Play'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
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
  inputContainer: {
    width: '100%',
    marginTop: 24,
  },
  inputLabel: {
    marginLeft: 12,
    marginBottom: 4,
    color: '#0f186e',
    fontWeight: '600',
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f186e',
    padding: 12,
    minHeight: 120,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 24,
  },
  playButton: {
    backgroundColor: '#0f186e',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
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
