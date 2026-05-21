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
  models,
  useTextToSpeech,
  TextToSpeechModelConfig,
} from 'react-native-executorch';
import { ModelPicker, ModelOption } from '../components/ModelPicker';

const tts = models.text_to_speech.kokoro;

const VOICES: ModelOption<TextToSpeechModelConfig>[] = [
  { label: '🇺🇸 AF Heart', value: tts.en_us.heart() },
  { label: '🇺🇸 AF River', value: tts.en_us.river() },
  { label: '🇺🇸 AF Sarah', value: tts.en_us.sarah() },
  { label: '🇺🇸 AM Adam', value: tts.en_us.adam() },
  { label: '🇺🇸 AM Michael', value: tts.en_us.michael() },
  { label: '🇺🇸 AM Santa', value: tts.en_us.santa() },
  { label: '🇬🇧 BF Emma', value: tts.en_gb.emma() },
  { label: '🇬🇧 BM Daniel', value: tts.en_gb.daniel() },
  { label: '🇫🇷 FF Siwis', value: tts.fr.siwis() },
  { label: '🇪🇸 EF Dora', value: tts.es.dora() },
  { label: '🇪🇸 EM Alex', value: tts.es.alex() },
  { label: '🇮🇹 IF Sara', value: tts.it.sara() },
  { label: '🇮🇹 IM Nicola', value: tts.it.nicola() },
  { label: '🇵🇹 PF Dora', value: tts.pt.dora() },
  { label: '🇵🇹 PM Santa', value: tts.pt.santa() },
  { label: '🇩🇪 DF Anna', value: tts.de.anna() },
  { label: '🇵🇱 PM Mateusz', value: tts.pl.mateusz() },
  { label: '🇮🇳 HF Alpha', value: tts.hi.alpha() },
  { label: '🇮🇳 HM Omega', value: tts.hi.omega() },
  { label: '🇮🇳 HM Psi', value: tts.hi.psi() },
];

import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  AudioManager,
  AudioContext,
  AudioBuffer,
  AudioBufferSourceNode,
} from 'react-native-audio-api';
import SWMIcon from '../assets/swm_icon.svg';
import ErrorBanner from '../components/ErrorBanner';

/**
 * Converts an audio vector (Float32Array) to an AudioBuffer for playback
 * @param audioVector - The generated audio samples from the model
 * @param audioContext - An optional AudioContext to create the buffer in. If not provided, a new one will be created.
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
  const [selectedSpeaker, setSelectedSpeaker] =
    useState<TextToSpeechModelConfig>(tts.en_us.heart());

  const model = useTextToSpeech(selectedSpeaker);

  const [inputText, setInputText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<any>(null);
  const sourceRef = useRef<AudioBufferSourceNode>(null);

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['defaultToSpeaker'],
    });

    const context = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = context;
    context.suspend();

    // Increase the audio volume
    const gainNode = context.createGain();
    gainNode.gain.value = 2.0; // Increase volume by 2x
    gainNode.connect(context.destination);
    gainNodeRef.current = gainNode;

    return () => {
      audioContextRef.current?.close();
      audioContextRef.current = null;
      gainNodeRef.current = null;
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

          if (gainNodeRef.current) {
            source.connect(gainNodeRef.current);
          } else {
            source.connect(audioContext.destination);
          }

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
        speed: 0.9,
        phonemize: true,
        onNext,
        onEnd,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setIsPlaying(false);
    }
  };

  const getModelStatus = () => {
    if (model.isGenerating) return 'Generating audio...';
    if (model.isReady) return 'Ready to synthesize';
    return `Loading model: ${(100 * model.downloadProgress).toFixed(2)}%`;
  };

  useEffect(() => {
    if (model.error) setError(String(model.error));
  }, [model.error]);

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
          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          <ModelPicker
            label="Voice"
            models={VOICES}
            selectedModel={selectedSpeaker}
            disabled={model.isGenerating}
            onSelect={(m) => setSelectedSpeaker(m)}
          />

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Enter text to synthesize</Text>
            <TextInput
              placeholder="Type something..."
              placeholderTextColor="#aaa"
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
    color: '#0f186e',
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
