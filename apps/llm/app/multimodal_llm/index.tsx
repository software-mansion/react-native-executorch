import { useContext, useEffect, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  AudioManager,
  AudioRecorder,
  AudioContext,
} from 'react-native-audio-api';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { models, useLLM } from 'react-native-executorch';
import SendIcon from '../../assets/icons/send_icon.svg';
import PauseIcon from '../../assets/icons/pause_icon.svg';
import ColorPalette from '../../colors';
import Messages from '../../components/Messages';
import Spinner from '../../components/Spinner';
import { GeneratingContext } from '../../context';
import SuggestedPrompts from '../../components/SuggestedPrompts';
import ErrorBanner from '../../components/ErrorBanner';
import AudioWaveform from '../../components/AudioWaveform';

const SUGGESTED_PROMPTS = [
  "What's in this image?",
  'Describe this scene in detail',
  'What objects can you see?',
  'What text appears in this image?',
  'Transcribe the audio?',
];
import { useLLMStats } from '../../hooks/useLLMStats';
import { StatsBar } from '../../components/StatsBar';

export default function MultimodalLLMScreenWrapper() {
  const isFocused = useIsFocused();
  return isFocused ? <MultimodalLLMScreen /> : null;
}

function MultimodalLLMScreen() {
  const { bottom } = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const { setGlobalGenerating } = useContext(GeneratingContext);

  const [audioBuffer, setAudioBuffer] = useState<Float32Array | null>(null);
  const [audioLabel, setAudioLabel] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const recorder = useRef(new AudioRecorder());
  const recordChunks = useRef<Float32Array[]>([]);

  const [error, setError] = useState<string | null>(null);
  const model = models.llm.gemma4_e2b_multimodal();
  const vlm = useLLM({ model: model });
  const tokenCount = vlm.isReady ? vlm.getGeneratedTokenCount() : 0;
  const { stats, onMessageSend } = useLLMStats(
    vlm.response,
    vlm.isGenerating,
    tokenCount
  );

  useEffect(() => {
    setGlobalGenerating(vlm.isGenerating);
  }, [vlm.isGenerating, setGlobalGenerating]);

  // Updated to use local error state
  useEffect(() => {
    if (vlm.error) setError(String(vlm.error));
  }, [vlm.error]);

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetoothHFP', 'defaultToSpeaker'],
    });
    (async () => {
      const status = await AudioManager.requestRecordingPermissions();
      setHasMicPermission(status === 'Granted');
    })();

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      recorder.current.stop();
      AudioManager.setAudioSessionActivity(false);
    };
  }, []);

  const loadAudioFromUrl = async () => {
    const url = audioUrl.trim();
    if (!url) return;
    setIsFetchingAudio(true);
    try {
      const ctx = new AudioContext({ sampleRate: 16000 });
      const decoded = await ctx.decodeAudioData(url);
      const pcm = decoded.getChannelData(0);
      const name = url.split('/').pop() || 'audio';
      setAudioBuffer(pcm);
      setAudioLabel(`${name} · ${(pcm.length / 16000).toFixed(1)}s`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsFetchingAudio(false);
    }
  };

  const startRecording = async () => {
    if (!hasMicPermission) {
      setError('Microphone permission denied. Please enable it in Settings.');
      return;
    }
    recordChunks.current = [];
    const sampleRate = 16000;
    recorder.current.onAudioReady(
      { sampleRate, bufferLength: 0.1 * sampleRate, channelCount: 1 },
      ({ buffer }) => {
        recordChunks.current.push(new Float32Array(buffer.getChannelData(0)));
      }
    );
    try {
      const ok = await AudioManager.setAudioSessionActivity(true);
      if (!ok) {
        setError('Cannot start audio session');
        return;
      }
      const result = recorder.current.start();
      if (result.status === 'error') {
        setError(`Recording problems: ${result.message}`);
        return;
      }
      setIsRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const stopRecording = () => {
    recorder.current.stop();
    setIsRecording(false);
    const total = recordChunks.current.reduce((n, c) => n + c.length, 0);
    if (total === 0) return;
    const pcm = new Float32Array(total);
    let off = 0;
    for (const c of recordChunks.current) {
      pcm.set(c, off);
      off += c.length;
    }
    recordChunks.current = [];
    setAudioBuffer(pcm);
    setAudioLabel(`Recording · ${(pcm.length / 16000).toFixed(1)}s`);
  };

  const clearAudio = () => {
    setAudioBuffer(null);
    setAudioLabel(null);
  };

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo' });
      if (result.assets && result.assets.length > 0) {
        const uri = result.assets[0]?.uri;
        if (uri) setImageUri(uri);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const sendMessage = async () => {
    if (!(imageUri || audioBuffer || userInput.trim()) || vlm.isGenerating)
      return;
    onMessageSend();
    const text = userInput.trim();
    setUserInput('');
    textInputRef.current?.clear();
    Keyboard.dismiss();
    const currentImageUri = imageUri;
    const currentAudio = audioBuffer;
    setImageUri(null);
    setAudioBuffer(null);
    setAudioLabel(null);
    try {
      const media =
        currentImageUri || currentAudio
          ? {
              ...(currentImageUri ? { imagePath: currentImageUri } : {}),
              ...(currentAudio ? { audioBuffer: currentAudio } : {}),
            }
          : undefined;
      await vlm.sendMessage(text, media);
    } catch (e) {
      // Updated to set UI error instead of just console.error
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  // Updated Spinner check so it doesn't block the ErrorBanner if loading fails
  if (!vlm.isReady && !vlm.error) {
    return (
      <Spinner
        visible={true}
        textContent={`Loading model ${(vlm.downloadProgress * 100).toFixed(0)}%`}
      />
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        collapsable={false}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 40}
      >
        <View style={styles.container}>
          {/* Injected ErrorBanner here */}
          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          {vlm.messageHistory.length ? (
            <View style={styles.chatContainer}>
              <Messages
                chatHistory={vlm.messageHistory}
                llmResponse={vlm.response}
                isGenerating={vlm.isGenerating}
                deleteMessage={vlm.deleteMessage}
              />
            </View>
          ) : (
            <View style={styles.helloMessageContainer}>
              <Text style={styles.helloText}>Hello! 👋</Text>
              <Text style={styles.bottomHelloText}>
                {model.capabilities.find((c) => c === 'audio')
                  ? 'Say "Hi" or pick an image or and ask me anything about it.'
                  : 'Pick an image and ask me anything about it.'}
              </Text>
              <SuggestedPrompts
                prompts={SUGGESTED_PROMPTS}
                onSelect={setUserInput}
              />
            </View>
          )}

          {/* Image thumbnail strip */}
          {imageUri && (
            <TouchableOpacity
              style={styles.imageThumbnailContainer}
              onPress={pickImage}
            >
              <Image
                source={{ uri: imageUri }}
                style={styles.imageThumbnail}
                resizeMode="cover"
              />
              <Text style={styles.imageThumbnailHint}>Tap to change</Text>
            </TouchableOpacity>
          )}

          {/* Audio URL input */}
          <View style={styles.audioUrlRow}>
            <TextInput
              placeholder="Audio URL (mp3/wav/…)"
              placeholderTextColor="#C1C6E5"
              style={styles.audioUrlInput}
              value={audioUrl}
              onChangeText={setAudioUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[
                styles.audioUrlButton,
                (!audioUrl.trim() || isFetchingAudio || vlm.isGenerating) &&
                  styles.disabled,
              ]}
              onPress={loadAudioFromUrl}
              disabled={!audioUrl.trim() || isFetchingAudio || vlm.isGenerating}
            >
              <Text style={styles.audioUrlButtonText}>
                {isFetchingAudio ? '…' : 'Load'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Audio attachment strip */}
          {audioLabel && (
            <View style={styles.audioAttachmentContainer}>
              <View style={styles.audioAttachmentRow}>
                <Text style={styles.audioAttachmentText}>🎵 {audioLabel}</Text>
                <TouchableOpacity onPress={clearAudio}>
                  <Text style={styles.audioAttachmentClear}>✕</Text>
                </TouchableOpacity>
              </View>
              <AudioWaveform
                buffer={audioBuffer}
                style={styles.audioWaveform}
              />
            </View>
          )}

          <StatsBar stats={stats} />
          <View
            style={[
              styles.bottomContainer,
              Platform.OS === 'android' && {
                paddingBottom: bottom || 16,
                height: 100 + (bottom || 16),
              },
            ]}
          >
            {/* Image picker button */}
            <TouchableOpacity
              style={styles.imageButton}
              onPress={pickImage}
              disabled={vlm.isGenerating}
            >
              <Text style={styles.imageButtonText}>📷</Text>
            </TouchableOpacity>

            {/* Mic record / stop button */}
            <TouchableOpacity
              style={styles.imageButton}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={vlm.isGenerating}
            >
              <Text style={styles.imageButtonText}>
                {isRecording ? '⏹️' : '🎤'}
              </Text>
            </TouchableOpacity>

            <TextInput
              autoCorrect={false}
              ref={textInputRef}
              onFocus={() => setIsTextInputFocused(true)}
              onBlur={() => setIsTextInputFocused(false)}
              style={[
                styles.textInput,
                {
                  borderColor: isTextInputFocused
                    ? ColorPalette.blueDark
                    : ColorPalette.blueLight,
                },
              ]}
              placeholder={imageUri ? 'Ask about the image…' : 'Your message'}
              placeholderTextColor="#C1C6E5"
              multiline
              value={userInput}
              onChangeText={setUserInput}
            />

            {(imageUri || audioBuffer || userInput.trim()) &&
              !vlm.isGenerating && (
                <TouchableOpacity
                  style={styles.sendChatTouchable}
                  onPress={sendMessage}
                >
                  <SendIcon height={24} width={24} padding={4} margin={8} />
                </TouchableOpacity>
              )}
            {vlm.isGenerating && (
              <TouchableOpacity
                style={styles.sendChatTouchable}
                onPress={vlm.interrupt}
              >
                <PauseIcon height={24} width={24} padding={4} margin={8} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  // Setup phase
  setupContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  setupTitle: {
    fontSize: 20,
    fontFamily: 'medium',
    color: ColorPalette.primary,
    marginBottom: 8,
  },
  setupHint: {
    fontSize: 13,
    fontFamily: 'regular',
    color: ColorPalette.blueDark,
    marginBottom: 32,
    lineHeight: 18,
  },
  filePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ColorPalette.blueLight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#fafbff',
  },
  filePickerInfo: { flex: 1 },
  filePickerLabel: {
    fontSize: 12,
    fontFamily: 'medium',
    color: ColorPalette.blueDark,
    marginBottom: 2,
  },
  filePickerValue: { fontSize: 14, fontFamily: 'regular' },
  filePickerValueSet: { color: ColorPalette.primary },
  filePickerValueEmpty: { color: ColorPalette.blueLight },
  filePickerChevron: {
    fontSize: 24,
    color: ColorPalette.blueLight,
    marginLeft: 8,
  },
  loadButton: {
    marginTop: 16,
    backgroundColor: ColorPalette.strongPrimary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  loadButtonDisabled: { backgroundColor: ColorPalette.blueLight },
  loadButtonText: { color: '#fff', fontFamily: 'medium', fontSize: 15 },

  // Chat phase
  container: { flex: 1 },
  chatContainer: { flex: 10, width: '100%' },
  helloMessageContainer: {
    flex: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
    paddingHorizontal: 24,
  },
  imageThumbnailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  imageThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ColorPalette.blueLight,
  },
  imageThumbnailHint: {
    fontSize: 12,
    fontFamily: 'regular',
    color: ColorPalette.blueDark,
  },
  audioAttachmentContainer: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ColorPalette.blueLight,
    backgroundColor: '#fafbff',
  },
  audioAttachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioAttachmentText: {
    fontSize: 13,
    fontFamily: 'regular',
    color: ColorPalette.blueDark,
  },
  audioAttachmentClear: {
    fontSize: 16,
    color: ColorPalette.blueDark,
    paddingHorizontal: 8,
  },
  audioWaveform: {
    marginTop: 6,
    minWidth: 0,
  },
  audioUrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 4,
  },
  audioUrlInput: {
    flex: 1,
    padding: 10,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: ColorPalette.blueLight,
    borderRightWidth: 0,
    fontFamily: 'regular',
    fontSize: 13,
    color: ColorPalette.primary,
  },
  audioUrlButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: ColorPalette.strongPrimary,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioUrlButtonText: {
    color: '#fff',
    fontFamily: 'medium',
    fontSize: 13,
  },
  disabled: {
    opacity: 0.5,
  },
  bottomContainer: {
    height: 100,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  imageButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  imageButtonText: { fontSize: 22 },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    lineHeight: 19.6,
    fontFamily: 'regular',
    fontSize: 14,
    color: ColorPalette.primary,
    padding: 16,
  },
  sendChatTouchable: {
    height: '100%',
    width: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});
