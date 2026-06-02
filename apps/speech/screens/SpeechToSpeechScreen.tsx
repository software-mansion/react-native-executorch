import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  AudioManager,
  AudioContext,
  AudioBufferSourceNode,
} from 'react-native-audio-api';
import { models, useTextToSpeech } from 'react-native-executorch';
import Equaliser from '../components/Equaliser';
import { bubbleData } from '../assets/data/bubblePresets';
import { BubbleData } from '../assets/types/bubbleTypes';
import SWMIcon from '../assets/swm_icon.svg';
import ErrorBanner from '../components/ErrorBanner';

const tts = models.text_to_speech.kokoro;

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

function rms(frame: Float32Array) {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
  return Math.sqrt(sum / frame.length);
}

export const SpeechToSpeechScreen = ({ onBack }: { onBack: () => void }) => {
  const [inputText, setInputText] = useState(
    "React Native ExecuTorch is amazing! I can't stop using it."
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const model = useTextToSpeech(tts.en_us.heart());
  const volume = useRef(0.0);
  const equaliserData = useRef<BubbleData>(bubbleData[0]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
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

  useEffect(() => {
    if (model.error) setError(String(model.error));
  }, [model.error]);

  const handleGenerateAndPlay = useCallback(async () => {
    if (!inputText.trim() || !model.isReady || isPlaying) return;

    Keyboard.dismiss();
    setIsPlaying(true);

    try {
      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      await model.stream({
        text: inputText,
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
          setIsPlaying(false);
          volume.current = 0.0;
          const currentAudioContext = audioContextRef.current;
          if (currentAudioContext) {
            await currentAudioContext.suspend();
          }
        },
      });
    } catch (e) {
      console.error('Error generating or playing audio:', e);
      setError(e instanceof Error ? e.message : String(e));
      setIsPlaying(false);
      volume.current = 0.0;
    }
  }, [inputText, model, isPlaying]);

  const getModelStatus = () => {
    if (model.error) return `Error: ${model.error}`;
    if (model.isGenerating) return 'Generating audio...';
    if (isPlaying) return 'Playing...';
    if (!model.isReady)
      return `Loading model: ${(100 * model.downloadProgress).toFixed(0)}%`;
    return 'Ready to synthesize';
  };

  return (
    <SafeAreaProvider>
      <View style={styles.shaderContainer}>
        <Equaliser volume={volume} equaliserData={equaliserData} />
      </View>

      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <FontAwesome name="chevron-left" size={20} color="#0f186e" />
          </TouchableOpacity>
          <SWMIcon width={50} height={50} />
          <Text style={styles.headerText}>Audio Visualiser</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{getModelStatus()}</Text>
        </View>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <KeyboardAvoidingView
          style={styles.bottomArea}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TextInput
            placeholder="Type something..."
            placeholderTextColor="#aaa"
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.buttonContainer}>
            <View
              style={[
                styles.playButtonWrapper,
                !readyToGenerate && styles.borderGrey,
              ]}
            >
              <TouchableOpacity
                disabled={!readyToGenerate}
                onPress={handleGenerateAndPlay}
                style={[
                  styles.playButton,
                  !readyToGenerate && styles.backgroundGrey,
                ]}
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
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    paddingTop: 8,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff88',
    borderRadius: 8,
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'gray',
    textAlign: 'center',
  },
  bottomArea: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 12,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f186e',
    padding: 12,
    minHeight: 80,
    fontSize: 16,
    color: '#0f186e',
  },
  buttonContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  playButtonWrapper: {
    borderWidth: 3,
    borderColor: '#001A72',
    borderRadius: 50,
    padding: 2,
  },
  playButton: {
    backgroundColor: '#001A72',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 40,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    letterSpacing: -0.5,
    fontSize: 16,
  },
  borderGrey: {
    borderColor: 'grey',
  },
  backgroundGrey: {
    backgroundColor: 'grey',
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
