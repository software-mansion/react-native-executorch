import { bubbleData } from '@/assets/data/bubblePresets';
import { BubbleData } from '@/assets/types/bubbleTypes';
import { Settings } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AudioContext,
  AudioManager,
  AudioBufferSourceNode,
} from 'react-native-audio-api';
import {
  KOKORO_MEDIUM,
  KOKORO_VOICE_AF_HEART,
  useTextToSpeech,
} from 'react-native-executorch';
import SWMIcon from '../assets/swm_icon.svg';
import EqualiserOptionsModal from '../components/EqualiserOptionsModal';

import Equaliser from '../components/Equaliser';

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

const SpeechToTextScreen = () => {
  const [inputText, setInputText] = useState(
    "React Native ExecuTorch is amazing! I can't stop using it; since it's so fucking good!"
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const equaliserData = useRef<BubbleData>(bubbleData[0]);

  const [optionsAreOpened, setOptionsAreOpened] = useState(false);
  const openOptions = () => {
    setOptionsAreOpened(true);
  };

  const volume = useRef(0.0);

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
      iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
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

            // Split the chunk into smaller pieces for the visualizer to create motion
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
    } catch (error) {
      console.error('Error generating or playing audio:', error);
      setIsPlaying(false);
      volume.current = 0.0;
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
    <>
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.topContainer}>
          <View style={styles.navContainer}>
            <SWMIcon width={80} height={80} />
            <TouchableOpacity onPress={openOptions}>
              <Settings size={30} color="#071576" />
            </TouchableOpacity>
          </View>
          <Text style={styles.topContainerText}>{'Audio Visualiser'}</Text>
        </View>
        <View style={styles.transcriptionContainer}>
          <Text style={[styles.transcriptionText, styles.textGreyCenter]}>
            {getStatusText()}
          </Text>
        </View>
        <View style={styles.iconsContainer}>
          <View
            style={[
              styles.recordingButtonWrapper,
              (!model.isReady || isPlaying) && styles.borderGrey,
              isPlaying && styles.borderRed,
            ]}
          >
            <TouchableOpacity
              disabled={!model.isReady || isPlaying}
              style={[
                styles.recordingButton,
                (!model.isReady || isPlaying) && styles.backgroundGrey,
                isPlaying && styles.backgroundRed,
              ]}
              onPress={handleGenerateAndPlay}
            >
              <Text style={styles.recordingButtonText}>
                {isPlaying ? 'PLAYING...' : 'GENERATE & PLAY'}
              </Text>
            </TouchableOpacity>
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
    </>
  );
};

export default SpeechToTextScreen;

const styles = StyleSheet.create({
  textInput: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: '75%',
    borderRadius: 20,
  },
  inputContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 20,
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
  imageContainer: {
    flex: 6,
    width: '100%',
    padding: 16,
  },
  image: {
    flex: 1,
    borderRadius: 8,
    width: '100%',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  recordingButtonWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    borderWidth: 3,
    borderColor: '#001A72',
    borderRadius: 50,
  },
  recordingButton: {
    paddingVertical: 20,
    backgroundColor: '#001A72',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderRadius: 40,
  },
  topContainer: {
    marginTop: 50,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topContainerText: {
    height: 35,
    fontSize: 30,
    marginTop: 5,
    color: '#001A72',
    fontWeight: '600',
  },
  transcriptionContainer: {
    flex: 7,
    paddingTop: 80,
    width: '90%',
  },
  transcriptionText: {
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: '#ffffff88',
    textAlign: 'center',
    padding: 10,
    borderRadius: 8,
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
    fontWeight: '600',
  },
  textGreyCenter: {
    color: 'gray',
    textAlign: 'center',
  },
  redText: {
    color: 'red',
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
  emulatorWarning: {
    color: 'rgb(254, 148, 141)',
    fontSize: 11,
  },
});
