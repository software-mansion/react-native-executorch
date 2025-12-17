import React, { useEffect, useState } from 'react';
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
  KOKORO_VOICE_AM_ADAM,
  useTextToSpeech,
} from 'react-native-executorch';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  AudioManager,
  AudioContext,
  AudioBuffer,
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
  sampleRate: number = 24000
): AudioBuffer => {
  const audioContext = new AudioContext({ sampleRate });
  const audioBuffer = audioContext.createBuffer(
    1,
    audioVector.length,
    sampleRate
  );
  const channelData = audioBuffer.getChannelData(0);
  channelData.set(audioVector);
  return audioBuffer;
};

export const TextToSpeechScreen = () => {
  const model = useTextToSpeech({
    model: KOKORO_EN,
    voice: KOKORO_VOICE_AM_ADAM,
  });

  const [inputText, setInputText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playback',
      iosMode: 'spokenAudio',
      iosOptions: ['defaultToSpeaker'],
    });
  }, []);

  const handlePlayAudio = async () => {
    if (!inputText.trim()) {
      return;
    }

    setIsPlaying(true);

    try {
      const audioVector = await model.forward({
        text: inputText,
        speed: 1.0,
      });
      const audioBuffer = createAudioBufferFromVector(audioVector);

      const audioContext = new AudioContext({ sampleRate: 24000 });
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      source.onEnded = () => {
        setIsPlaying(false);
        audioContext.close();
      };

      source.start();
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

  const readyToGenerate = !model.isGenerating && model.isReady && !isPlaying;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
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
