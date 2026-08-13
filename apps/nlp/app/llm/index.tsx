import React, { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image as RNImage,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Skia } from '@shopify/react-native-skia';
import {
  useLLMChatSession,
  models,
  type ChatMessage,
  type GenerationStats,
  cv,
} from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { NestedModelPicker, findPath } from '../../components/ModelPicker';

const SYSTEM_PROMPT = 'You are a helpful multimodal assistant by Liquid AI.';
const INITIAL_MESSAGES: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];
const GENERATION_CONFIG = { temperature: 0.7, maxNewTokens: 512, echo: false };

type Turn = {
  role: 'user' | 'assistant';
  content: string;
  imageUri?: string;
  stats?: GenerationStats;
};

function formatStats(stats: GenerationStats): string {
  const decodeMs = stats.inferenceEndMs - stats.firstTokenMs;
  const tokensPerSec = (stats.numGeneratedTokens / decodeMs) * 1000;
  const totalMs = stats.inferenceEndMs - stats.inferenceStartMs;
  const ttftMs = stats.firstTokenMs - stats.inferenceStartMs;
  return (
    `gen ${stats.numGeneratedTokens} tokens · ` +
    `${tokensPerSec.toFixed(1)} tok/s · ` +
    `${ttftMs.toFixed(0)}ms ttft · ` +
    `${(totalMs / 1000).toFixed(2)}s`
  );
}

function getFirstLeafModel(node: any): any {
  if (!node || typeof node !== 'object') return null;
  for (const key of Object.keys(node)) {
    if (typeof node[key] === 'object' && node[key] !== null) {
      const leaf = getFirstLeafModel(node[key]);
      if (leaf) return leaf;
    }
  }
  if (typeof node.modelPath === 'string') return node;
  return null;
}

function LLMContent() {
  const [selectedModel, setSelectedModel] = useState<any>(
    models.llm.LFM2_5_VL_450M ?? getFirstLeafModel(models.llm)
  );
  const [activeModel, setActiveModel] = useState<any>(null);
  const [forceDownload, setForceDownload] = useState(false);

  const { isReady, downloadProgress, error, sendMessage, stop } = useLLMChatSession(
    activeModel || selectedModel,
    {
      initialMessages: INITIAL_MESSAGES,
      generationConfig: GENERATION_CONFIG,
      preventLoad: !activeModel,
      forceDownload,
    }
  );

  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [streamingResponse, setStreamingResponse] = useState<string | null>(null);

  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const isGenerating = streamingResponse !== null;

  const selectedModelName = findPath(models.llm, selectedModel)?.join(' ') || 'Selected Model';

  // Reset chat turns when model changes
  useEffect(() => {
    setTurns([]);
    setStreamingResponse(null);
    setInput('');
  }, [activeModel]);

  // Reset forceDownload when model finishes loading and is ready
  useEffect(() => {
    if (isReady) setForceDownload(false);
  }, [isReady]);

  const handleLoadModel = (force = false) => {
    setForceDownload(force);
    setActiveModel(selectedModel);
  };

  const [attachedImage, setAttachedImage] = useState<{
    uri: string;
    buffer: cv.ImageBuffer;
    name: string;
  } | null>(null);

  const handlePickGalleryImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access photo gallery is required!');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        base64: true,
      });

      if (pickerResult.canceled || !pickerResult.assets[0]?.base64) return;
      const asset = pickerResult.assets[0];

      const skData = Skia.Data.fromBase64(asset.base64!);
      const skImage = Skia.Image.MakeImageFromEncoded(skData);
      if (!skImage) {
        Alert.alert('Error', 'Failed to decode selected image.');
        return;
      }

      const pixels = skImage.readPixels();
      if (!pixels || !(pixels instanceof Uint8Array)) {
        Alert.alert('Error', 'Failed to read image pixel data.');
        return;
      }

      const buffer: cv.ImageBuffer = {
        data: pixels,
        width: skImage.width(),
        height: skImage.height(),
        format: 'rgba',
        layout: 'hwc',
      };

      setAttachedImage({
        uri: asset.uri,
        buffer,
        name: asset.fileName || `Photo (${skImage.width()}×${skImage.height()})`,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to select gallery image');
    }
  };

  const handleSend = async () => {
    const textMessage = input.trim();
    if ((!textMessage && !attachedImage) || !sendMessage || isGenerating) return;

    const currentImage = attachedImage;
    setAttachedImage(null);
    setInput('');
    setStreamingResponse('');

    const turnUserMessage = textMessage || '[Image Attached]';
    setTurns((prev) => [
      ...prev,
      { role: 'user', content: turnUserMessage, imageUri: currentImage?.uri },
    ]);

    try {
      const payload = currentImage
        ? ([
            { kind: 'image' as const, image: currentImage.buffer },
            textMessage || 'What is in this image?',
          ] as const)
        : textMessage;

      const { response, stats } = await sendMessage(payload as any, (token) => {
        setStreamingResponse((prev) => (prev !== null ? prev + token : token));
      });
      setTurns((prev) => [...prev, { role: 'assistant', content: response as string, stats }]);
    } finally {
      setStreamingResponse(null);
    }
  };

  const renderContent = () => {
    if (!activeModel) {
      return (
        <View style={styles.centered}>
          <Text style={styles.infoTitle}>No model loaded</Text>
          <Text style={styles.infoBody}>
            {selectedModelName} is selected. Click below to load it and start chatting.
          </Text>
          <TouchableOpacity style={styles.loadButton} onPress={() => handleLoadModel(false)}>
            <Text style={styles.loadButtonText}>Load Model</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeModel !== selectedModel) {
      return (
        <View style={styles.centered}>
          <Text style={styles.infoTitle}>Switch to {selectedModelName}?</Text>
          <Text style={styles.infoBody}>
            Switching models will unload the current model and reset the chat session.
          </Text>
          <TouchableOpacity style={styles.loadButton} onPress={() => handleLoadModel(false)}>
            <Text style={styles.loadButtonText}>Load New Model</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setSelectedModel(activeModel)}
          >
            <Text style={styles.cancelButtonText}>Keep Current Model</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Failed to load model</Text>
          <Text style={styles.errorBody}>{error.message}</Text>
          <TouchableOpacity style={styles.loadButton} onPress={() => handleLoadModel(false)}>
            <Text style={styles.loadButtonText}>Retry Loading</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => handleLoadModel(true)}>
            <Text style={styles.secondaryButtonText}>Force Redownload</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!isReady) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0070f3" />
          <Text style={styles.loadingText}>
            {downloadProgress < 100
              ? `Downloading model… ${downloadProgress.toFixed(0)}%`
              : 'Loading model into memory…'}
          </Text>
          <Text style={styles.loadingSub}>{activeModel.modelPath}</Text>
        </View>
      );
    }

    return (
      <>
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {turns.length === 0 && streamingResponse === null && (
            <Text style={styles.placeholder}>Ask the on-device model anything to get started.</Text>
          )}
          {turns.map((turn, idx) => (
            <View key={idx} style={styles.turn}>
              <View
                style={[
                  styles.bubble,
                  turn.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                {turn.imageUri && (
                  <RNImage source={{ uri: turn.imageUri }} style={styles.turnThumbnail} />
                )}
                <Text style={turn.role === 'user' ? styles.userText : styles.assistantText}>
                  {turn.content || '…'}
                </Text>
              </View>
              {turn.stats && (
                <Text
                  style={styles.statsLine}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {formatStats(turn.stats)}
                </Text>
              )}
            </View>
          ))}
          {streamingResponse !== null && (
            <View style={styles.turn}>
              <View style={[styles.bubble, styles.assistantBubble]}>
                <Text style={styles.assistantText}>{streamingResponse || '…'}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {attachedImage && (
          <View style={styles.attachmentBar}>
            <RNImage source={{ uri: attachedImage.uri }} style={styles.attachmentPreview} />
            <View style={styles.attachmentInfo}>
              <Text style={styles.attachmentName} numberOfLines={1}>
                {attachedImage.name}
              </Text>
              <Text style={styles.attachmentSub}>Image Attached</Text>
            </View>
            <TouchableOpacity
              style={styles.removeAttachmentButton}
              onPress={() => setAttachedImage(null)}
            >
              <Text style={styles.removeAttachmentText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handlePickGalleryImage}
            disabled={isGenerating}
          >
            <Text style={styles.galleryButtonText}>🖼 Gallery</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor="#999"
            value={input}
            onChangeText={setInput}
            multiline
            editable={!isGenerating}
          />
          {isGenerating ? (
            <TouchableOpacity
              style={[styles.sendButton, styles.stopButton]}
              onPress={() => stop?.()}
            >
              <Text style={styles.sendButtonText}>Stop</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.sendButton,
                !input.trim() && !attachedImage && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!input.trim() && !attachedImage}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          )}
        </View>
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Model Selector Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.pickerContainer}>
            <NestedModelPicker
              labelPrefix="Model"
              registry={models.llm}
              selectedValue={selectedModel}
              onValueChange={(m) => {
                setForceDownload(false);
                setSelectedModel(m);
              }}
            />
          </View>
          <TouchableOpacity
            style={styles.redownloadHeaderButton}
            onPress={() => handleLoadModel(true)}
          >
            <Text style={styles.redownloadHeaderText}>Redownload</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Content */}
      <View style={styles.content}>{renderContent()}</View>
    </KeyboardAvoidingView>
  );
}

export default function LLMScreen() {
  return (
    <ScreenWrapper>
      <LLMContent />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  content: {
    flex: 1,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 16, fontSize: 15, color: '#495057', fontWeight: '600' },
  loadingSub: { marginTop: 4, fontSize: 13, color: '#868e96', textAlign: 'center' },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#e03131', marginBottom: 8 },
  errorBody: { fontSize: 13, color: '#868e96', textAlign: 'center' },
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },
  placeholder: { textAlign: 'center', color: '#adb5bd', marginTop: 40, fontSize: 14 },
  turn: { marginBottom: 12 },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statsLine: {
    alignSelf: 'flex-start',
    marginTop: 5,
    marginLeft: 4,
    fontSize: 11,
    color: '#adb5bd',
    // cspell:disable-next-line
    fontVariant: ['tabular-nums'],
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#0070f3' },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  userText: { color: '#fff', fontSize: 15, lineHeight: 21 },
  assistantText: { color: '#212529', fontSize: 15, lineHeight: 21 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f3f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#212529',
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#0070f3',
    borderRadius: 20,
    paddingHorizontal: 18,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#a3cdff' },
  stopButton: { backgroundColor: '#e03131' },
  sendButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoBody: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  loadButton: {
    backgroundColor: '#0070f3',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: '#f1f3f5',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#495057',
    fontSize: 15,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerContainer: {
    flex: 1,
  },
  redownloadHeaderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f3f5',
    borderRadius: 12,
  },
  redownloadHeaderText: {
    color: '#495057',
    fontSize: 13,
    fontWeight: '500',
  },
  galleryButton: {
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#e9ecef',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
  },
  attachmentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  attachmentPreview: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  attachmentSub: {
    fontSize: 12,
    color: '#868e96',
  },
  removeAttachmentButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f3f5',
  },
  removeAttachmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#868e96',
  },
  turnThumbnail: {
    width: 160,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#e9ecef',
  },
});
