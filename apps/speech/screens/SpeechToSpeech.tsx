import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';
import {
  AudioManager,
  AudioContext,
  AudioBufferSourceNode,
} from 'react-native-audio-api';
import {
  KOKORO_MEDIUM,
  KOKORO_VOICE_AF_HEART,
  useTextToSpeech,
} from 'react-native-executorch';
import { AudioVisualizer } from '../components/AudioVisualizer';

/**
 * Converts an audio vector (Float32Array) to an AudioBuffer for playback
 */
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

export const SpeechToSpeechScreen: React.FC = () => {
  const [inputText, setInputText] = useState(
    "React Native ExecuTorch is amazing! I can't stop using it; since it's so fucking good!"
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioData, setAudioData] = useState<Float32Array | null>(null);

  const model = useTextToSpeech({
    model: KOKORO_MEDIUM,
    voice: KOKORO_VOICE_AF_HEART,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetoothHFP', 'defaultToSpeaker'],
    });

    audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current.suspend();

    return () => {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  const handleGenerateAndPlay = useCallback(async () => {
    if (!inputText.trim() || !model.isReady || isPlaying) return;

    setIsPlaying(true);

    try {
      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      await model.stream({
        text: inputText,
        stopAutomatically: true,
        onNext: async (audioVec: Float32Array) => {
          // Send data to visualizer
          setAudioData(new Float32Array(audioVec));

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

            // Split the chunk into smaller pieces for the visualizer to create motion
            // Kokoro chunks are large (often 2048-4096+ samples)
            const subChunkSize = 512;
            for (let i = 0; i < audioVec.length; i += subChunkSize) {
              const offset = i;
              setTimeout(
                () => {
                  const subChunk = audioVec.slice(
                    offset,
                    offset + subChunkSize
                  );
                  setAudioData(new Float32Array(subChunk));
                },
                (i / 24000) * 1000
              );
            }
          });
        },
        onEnd: async () => {
          setIsPlaying(false);
          setAudioData(null);
          const currentAudioContext = audioContextRef.current;
          if (currentAudioContext) {
            await currentAudioContext.suspend();
          }
        },
      });
    } catch (error) {
      console.error('Error generating or playing audio:', error);
      setAudioData(null);
      setIsPlaying(false);
    }
  }, [inputText, model, isPlaying]);

  const getStatusText = () => {
    if (model.error) return `Error: ${model.error}`;
    if (model.isGenerating) return 'Generating...';
    if (isPlaying) return 'Playing...';
    if (!model.isReady)
      return `Loading model: ${(model.downloadProgress * 100).toFixed(0)}%`;
    return 'Ready to Synthesize';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>TTS Visualization</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Enter text..."
          placeholderTextColor="#666"
          multiline
        />
      </View>

      <View style={styles.visualizerContainer}>
        <AudioVisualizer isRecording={isPlaying} audioData={audioData} />
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            (isPlaying || !model.isReady) && styles.disabledButton,
          ]}
          onPress={handleGenerateAndPlay}
          disabled={isPlaying || !model.isReady}
        >
          <Text style={styles.recordButtonText}>
            {isPlaying ? 'Playing...' : 'Generate & Play'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SpeechToSpeechScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 60,
  },
  headerTitle: {
    color: '#0f186e',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  statusText: {
    color: '#0f186e',
    fontSize: 14,
    opacity: 0.8,
  },
  inputContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    color: '#0f186e',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#0f186e',
    minHeight: 80,
  },
  visualizerContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  controlsContainer: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#0f186e',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#ccc',
  },
  recordButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1.1,
  },
});
