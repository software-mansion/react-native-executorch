import { useContext, useEffect, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { useIsFocused } from '@react-navigation/native';
import { useMultimodalLLM } from 'react-native-executorch';
import ColorPalette from '../../colors';
import Spinner from '../../components/Spinner';
import { GeneratingContext } from '../../context';

export default function MultimodalLLMScreenWrapper() {
  const isFocused = useIsFocused();
  return isFocused ? <MultimodalLLMScreenOuter /> : null;
}

// Outer component: collect model + tokenizer paths before mounting the hook
function MultimodalLLMScreenOuter() {
  const [modelUri, setModelUri] = useState<string | null>(null);
  const [tokenizerUri, setTokenizerUri] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const pickFile = async (setter: (uri: string) => void) => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: false,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset?.uri) {
      setter(asset.uri);
    }
  };

  if (!confirmed) {
    return (
      <View style={styles.setupContainer}>
        <Text style={styles.setupTitle}>Select model files</Text>
        <Text style={styles.setupHint}>
          Pick the .pte model and tokenizer.json from your device storage.
        </Text>

        <FilePicker
          label="Model (.pte)"
          uri={modelUri}
          onPick={() => pickFile(setModelUri)}
        />
        <FilePicker
          label="Tokenizer (.json)"
          uri={tokenizerUri}
          onPick={() => pickFile(setTokenizerUri)}
        />

        <TouchableOpacity
          style={[
            styles.loadButton,
            (!modelUri || !tokenizerUri) && styles.loadButtonDisabled,
          ]}
          disabled={!modelUri || !tokenizerUri}
          onPress={() => setConfirmed(true)}
        >
          <Text style={styles.loadButtonText}>Load model</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <MultimodalLLMScreen
      modelSource={modelUri!}
      tokenizerSource={tokenizerUri!}
    />
  );
}

function FilePicker({
  label,
  uri,
  onPick,
}: {
  label: string;
  uri: string | null;
  onPick: () => void;
}) {
  const fileName = uri ? (uri.split('/').pop() ?? uri) : null;
  return (
    <TouchableOpacity style={styles.filePickerRow} onPress={onPick}>
      <View style={styles.filePickerInfo}>
        <Text style={styles.filePickerLabel}>{label}</Text>
        <Text
          style={[
            styles.filePickerValue,
            uri ? styles.filePickerValueSet : styles.filePickerValueEmpty,
          ]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {fileName ?? 'Tap to pick file'}
        </Text>
      </View>
      <Text style={styles.filePickerChevron}>›</Text>
    </TouchableOpacity>
  );
}

function MultimodalLLMScreen({
  modelSource,
  tokenizerSource,
}: {
  modelSource: string;
  tokenizerSource: string;
}) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { setGlobalGenerating } = useContext(GeneratingContext);

  const vlm = useMultimodalLLM({ model: { modelSource, tokenizerSource } });

  useEffect(() => {
    setGlobalGenerating(vlm.isGenerating);
  }, [vlm.isGenerating, setGlobalGenerating]);

  useEffect(() => {
    if (vlm.error) {
      console.error('MultimodalLLM error:', vlm.error);
    }
  }, [vlm.error]);

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo' });
    if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0]?.uri;
      if (uri) {
        setImageUri(uri);
      }
    }
  };

  const handleGenerate = async () => {
    if (!imageUri || !prompt.trim() || !vlm.isReady || vlm.isGenerating) return;
    Keyboard.dismiss();
    try {
      await vlm.generate(imageUri, prompt.trim());
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
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {/* Image picker */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.imagePickerText}>Tap to pick an image</Text>
            )}
          </TouchableOpacity>

          {/* Response area */}
          {vlm.response ? (
            <View style={styles.responseContainer}>
              <Text style={styles.responseLabel}>Response:</Text>
              <Text style={styles.responseText}>{vlm.response}</Text>
            </View>
          ) : vlm.isGenerating ? (
            <View style={styles.responseContainer}>
              <Text style={styles.responseLabel}>Generating…</Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom bar */}
        <View style={styles.bottomContainer}>
          <TextInput
            autoCorrect={false}
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
            placeholder="Ask about the image…"
            placeholderTextColor="#C1C6E5"
            multiline
            value={prompt}
            onChangeText={setPrompt}
          />
          {vlm.isGenerating ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={vlm.interrupt}
            >
              <Text style={styles.actionButtonText}>Stop</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                (!imageUri || !prompt.trim()) && styles.actionButtonDisabled,
              ]}
              onPress={handleGenerate}
              disabled={!imageUri || !prompt.trim()}
            >
              <Text style={styles.actionButtonText}>Ask</Text>
            </TouchableOpacity>
          )}
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
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8 },
  imagePicker: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ColorPalette.blueLight,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewImage: { width: '100%', height: '100%' },
  imagePickerText: {
    color: ColorPalette.blueLight,
    fontSize: 16,
    fontFamily: 'regular',
  },
  responseContainer: {
    backgroundColor: ColorPalette.seaBlueLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  responseLabel: {
    fontSize: 12,
    color: ColorPalette.blueDark,
    fontFamily: 'medium',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    lineHeight: 20,
    color: ColorPalette.primary,
    fontFamily: 'regular',
  },
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: ColorPalette.blueLight,
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 19.6,
    fontFamily: 'regular',
    color: ColorPalette.primary,
    padding: 12,
    maxHeight: 100,
  },
  actionButton: {
    marginLeft: 8,
    backgroundColor: ColorPalette.strongPrimary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDisabled: { backgroundColor: ColorPalette.blueLight },
  actionButtonText: { color: '#fff', fontFamily: 'medium', fontSize: 14 },
});
