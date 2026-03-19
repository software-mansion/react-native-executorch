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
import { useIsFocused } from '@react-navigation/native';
import { useLLM, LFM2_VL_1_6B_QUANTIZED } from 'react-native-executorch';
import SendIcon from '../../assets/icons/send_icon.svg';
import PauseIcon from '../../assets/icons/pause_icon.svg';
import ColorPalette from '../../colors';
import Messages from '../../components/Messages';
import Spinner from '../../components/Spinner';
import { GeneratingContext } from '../../context';
import SuggestedPrompts from '../../components/SuggestedPrompts';

const SUGGESTED_PROMPTS = [
  "What's in this image?",
  'Describe this scene in detail',
  'What objects can you see?',
  'What text appears in this image?',
];

export default function MultimodalLLMScreenWrapper() {
  const isFocused = useIsFocused();
  return isFocused ? <MultimodalLLMScreen /> : null;
}

function MultimodalLLMScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const { setGlobalGenerating } = useContext(GeneratingContext);

  const vlm = useLLM({
    model: LFM2_VL_1_6B_QUANTIZED,
  });

  useEffect(() => {
    setGlobalGenerating(vlm.isGenerating);
  }, [vlm.isGenerating, setGlobalGenerating]);

  useEffect(() => {
    if (vlm.error) console.error('MultimodalLLM error:', vlm.error);
  }, [vlm.error]);

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo' });
    if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0]?.uri;
      if (uri) setImageUri(uri);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || vlm.isGenerating) return;
    const text = userInput.trim();
    setUserInput('');
    textInputRef.current?.clear();
    Keyboard.dismiss();
    const currentImageUri = imageUri;
    setImageUri(null);
    try {
      await vlm.sendMessage(
        text,
        currentImageUri ? { imagePath: currentImageUri } : undefined
      );
    } catch (e) {
      console.error('Generation error:', e);
    }
  };

  if (!vlm.isReady) {
    return (
      <Spinner
        visible={!vlm.isReady}
        textContent={
          vlm.error
            ? `Error: ${vlm.error.message}`
            : `Loading model ${(vlm.downloadProgress * 100).toFixed(0)}%`
        }
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
                Pick an image and ask me anything about it.
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

          <View style={styles.bottomContainer}>
            {/* Image picker button */}
            <TouchableOpacity
              style={styles.imageButton}
              onPress={pickImage}
              disabled={vlm.isGenerating}
            >
              <Text style={styles.imageButtonText}>📷</Text>
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

            {userInput.trim() && !vlm.isGenerating && (
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
