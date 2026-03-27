import { useContext, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import SWMIcon from '../../assets/icons/swm_icon.svg';
import Spinner from '../../components/Spinner';
import ErrorBanner from '../../components/ErrorBanner';
import {
  useSpeechToText,
  useLLM,
  QWEN3_0_6B_QUANTIZED,
  QWEN3_1_7B_QUANTIZED,
  LLAMA3_2_1B_SPINQUANT,
  WHISPER_TINY_EN,
  WHISPER_TINY_EN_QUANTIZED,
  WHISPER_BASE_EN,
  WHISPER_SMALL_EN,
  LLMProps,
  SpeechToTextProps,
} from 'react-native-executorch';
import { ModelPicker, ModelOption } from '../../components/ModelPicker';
import PauseIcon from '../../assets/icons/pause_icon.svg';
import MicIcon from '../../assets/icons/mic_icon.svg';
import StopIcon from '../../assets/icons/stop_icon.svg';
import ColorPalette from '../../colors';
import Messages from '../../components/Messages';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import DeviceInfo from 'react-native-device-info';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GeneratingContext } from '../../context';

type LLMModelSources = LLMProps['model'];
type STTModelSources = SpeechToTextProps['model'];

const LLM_MODELS: ModelOption<LLMModelSources>[] = [
  { label: 'Qwen3 0.6B', value: QWEN3_0_6B_QUANTIZED },
  { label: 'Qwen3 1.7B', value: QWEN3_1_7B_QUANTIZED },
  { label: 'Llama 1B', value: LLAMA3_2_1B_SPINQUANT },
];

const STT_MODELS: ModelOption<STTModelSources>[] = [
  { label: 'Whisper Tiny', value: WHISPER_TINY_EN },
  { label: 'Whisper Tiny Q', value: WHISPER_TINY_EN_QUANTIZED },
  { label: 'Whisper Base', value: WHISPER_BASE_EN },
  { label: 'Whisper Small', value: WHISPER_SMALL_EN },
];

export default function VoiceChatScreenWrapper() {
  const isFocused = useIsFocused();

  return isFocused ? <VoiceChatScreen /> : null;
}

function VoiceChatScreen() {
  const { bottom } = useSafeAreaInsets();
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [selectedLLM, setSelectedLLM] =
    useState<LLMModelSources>(QWEN3_0_6B_QUANTIZED);
  const [selectedSTT, setSelectedSTT] =
    useState<STTModelSources>(WHISPER_TINY_EN);
  const [error, setError] = useState<string | null>(null);

  const [recorder] = useState(
    () =>
      new AudioRecorder({
        sampleRate: 16000,
        bufferLengthInSamples: 1600,
      })
  );

  const { setGlobalGenerating } = useContext(GeneratingContext);

  const llm = useLLM({ model: selectedLLM });
  const speechToText = useSpeechToText({
    model: selectedSTT,
  });

  useEffect(() => {
    setGlobalGenerating(llm.isGenerating || speechToText.isGenerating);
  }, [llm.isGenerating, speechToText.isGenerating, setGlobalGenerating]);

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
    });
    AudioManager.requestRecordingPermissions();
  }, []);

  const handleRecordPress = async () => {
    if (isRecording) {
      setIsRecording(false);
      recorder.stop();
      speechToText.streamStop();
    } else {
      setIsRecording(true);
      setLiveTranscription('');

      recorder.onAudioReady(({ buffer }) => {
        speechToText.streamInsert(buffer.getChannelData(0));
      });
      recorder.start();

      let finalResult = '';

      try {
        for await (const result of speechToText.stream()) {
          const text = result.committed.text + result.nonCommitted.text;
          setLiveTranscription(text);
          finalResult = text;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (finalResult.trim().length > 0) {
          await llm.sendMessage(finalResult);
          setLiveTranscription('');
        }
      }
    }
  };

  useEffect(() => {
    if (llm.error) setError(String(llm.error));
  }, [llm.error]);

  useEffect(() => {
    if (speechToText.error) setError(String(speechToText.error));
  }, [speechToText.error]);

  return (!llm.isReady || !speechToText.isReady) &&
    !llm.error &&
    !speechToText.error ? (
    <Spinner
      visible={true}
      textContent={`Loading the LLM model ${(llm.downloadProgress * 100).toFixed(0)} %\nLoading the speech model ${(speechToText.downloadProgress * 100).toFixed(0)} %`}
    />
  ) : (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
      >
        <View style={styles.topContainer}>
          <SWMIcon width={45} height={45} />
          <Text style={styles.textModelName}>Qwen 3 x Whisper</Text>
        </View>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
        {llm.messageHistory.length > 0 || liveTranscription.length > 0 ? (
          <View style={styles.chatContainer}>
            <Messages
              chatHistory={
                isRecording && liveTranscription.length > 0
                  ? [
                      ...llm.messageHistory,
                      {
                        role: 'user',
                        content: liveTranscription,
                      },
                    ]
                  : llm.messageHistory
              }
              llmResponse={llm.response}
              isGenerating={llm.isGenerating}
              deleteMessage={llm.deleteMessage}
            />
          </View>
        ) : (
          <View style={styles.helloMessageContainer}>
            <Text style={styles.helloText}>Hello! 👋</Text>
            <Text style={styles.bottomHelloText}>
              Tap the mic and speak to me. I'll transcribe your voice and
              respond using a language model — all on-device.
            </Text>
          </View>
        )}

        <ModelPicker
          models={LLM_MODELS}
          selectedModel={selectedLLM}
          onSelect={(m) => setSelectedLLM(m)}
        />
        <ModelPicker
          models={STT_MODELS}
          selectedModel={selectedSTT}
          onSelect={(m) => setSelectedSTT(m)}
        />

        <View
          style={[
            styles.bottomContainer,
            Platform.OS === 'android' && {
              paddingBottom: bottom || 16,
              height: 100 + (bottom || 16),
            },
          ]}
        >
          {DeviceInfo.isEmulatorSync() ? (
            <View style={styles.emulatorBox}>
              <Text style={[styles.emulatorWarning]}>
                recording disabled on emulator
              </Text>
            </View>
          ) : (
            <>
              {llm.isGenerating ? (
                <TouchableOpacity onPress={llm.interrupt}>
                  <PauseIcon height={40} width={40} padding={4} margin={8} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={
                    !isRecording ? styles.recordTouchable : styles.recordingInfo
                  }
                  onPress={handleRecordPress}
                >
                  {isRecording ? (
                    <StopIcon height={40} width={40} padding={4} margin={8} />
                  ) : (
                    <MicIcon height={40} width={40} padding={4} margin={8} />
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  topContainer: {
    height: 68,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 10,
    width: '100%',
  },
  textModelName: {
    color: ColorPalette.primary,
  },
  helloMessageContainer: {
    flex: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helloText: {
    fontFamily: 'medium',
    fontSize: 30,
    color: ColorPalette.primary,
  },
  bottomHelloText: {
    fontFamily: 'regular',
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
    color: ColorPalette.primary,
  },
  bottomContainer: {
    height: 100,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  recordTouchable: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emulatorBox: {
    padding: 10,
    margin: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: 'gray',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emulatorWarning: {
    color: 'gray',
    fontSize: 16,
  },
});
