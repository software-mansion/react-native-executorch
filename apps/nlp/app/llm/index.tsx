import React, { useRef, useState, type ComponentRef } from 'react';
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
import { Skia } from '@shopify/react-native-skia';
import {
  useLLMChatSession,
  models,
  type ChatMessage,
  type GenerationStats,
  cv,
} from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getImage, skImageToBuffer } from '../../utils';

const MODEL = models.llm.LFM2_5_350M;
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
    `${stats.numGeneratedTokens} tokens · ` +
    `${tokensPerSec.toFixed(1)} tok/s · ` +
    `${ttftMs.toFixed(0)}ms ttft · ` +
    `${(totalMs / 1000).toFixed(2)}s`
  );
}

function LLMContent() {
  const { isReady, downloadProgress, error, sendMessage, stop } = useLLMChatSession(MODEL, {
    initialMessages: INITIAL_MESSAGES,
    generationConfig: GENERATION_CONFIG,
  });

  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [streamingResponse, setStreamingResponse] = useState<string | null>(null);

  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const isGenerating = streamingResponse !== null;

  const [attachedImage, setAttachedImage] = useState<{
    uri: string;
    name: string;
    buffer: cv.ImageBuffer;
  } | null>(null);

  const handlePickGalleryImage = async () => {
    try {
      const uri = await getImage(false);
      if (!uri) return;

      const skData = await Skia.Data.fromURI(uri);
      if (!skData) throw new Error('Failed to read image file');
      const skImage = Skia.Image.MakeImageFromEncoded(skData);
      if (!skImage) throw new Error('Failed to decode image');

      const buffer = skImageToBuffer(skImage);
      setAttachedImage({ uri, buffer, name: `Photo (${skImage.width()}x${skImage.height()})` });
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

    setTurns((prev) => [
      ...prev,
      { role: 'user', content: textMessage, imageUri: currentImage?.uri },
    ]);

    try {
      let payload;
      if (currentImage) {
        payload = [
          { kind: 'image' as const, image: currentImage.buffer },
          textMessage || "What's in this image?",
        ];
      } else {
        payload = textMessage;
      }

      const { response, stats } = await sendMessage(payload, (token) => {
        setStreamingResponse((prev) => (prev !== null ? prev + token : token));
      });
      setTurns((prev) => [...prev, { role: 'assistant', content: response as string, stats }]);
    } finally {
      setStreamingResponse(null);
    }
  };

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Failed to load model</Text>
        <Text style={styles.errorBody}>{error.message}</Text>
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
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {turns.length === 0 && streamingResponse === null && (
          <Text style={styles.placeholder}>Ask LFM 2.5 VL anything or attach an image.</Text>
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
            {turn.stats && <Text style={styles.statsLine}>{formatStats(turn.stats)}</Text>}
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
          <Text style={styles.galleryButtonText}>📷</Text>
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
          <TouchableOpacity style={[styles.sendButton, styles.stopButton]} onPress={() => stop?.()}>
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 16, fontSize: 15, color: '#495057', fontWeight: '600' },
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
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#0070f3' },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  userText: { color: '#fff', fontSize: 15, lineHeight: 21 },
  assistantText: { color: '#212529', fontSize: 15, lineHeight: 21 },
  turnThumbnail: {
    width: 160,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#e9ecef',
  },
  statsLine: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginLeft: 4,
    fontSize: 11,
    color: '#adb5bd',
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
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#e9ecef',
  },
  attachmentInfo: { flex: 1 },
  attachmentName: { fontSize: 13, fontWeight: '500', color: '#212529' },
  removeAttachmentButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f3f5',
  },
  removeAttachmentText: { fontSize: 13, fontWeight: '700', color: '#868e96' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  galleryButton: {
    width: 44,
    height: 44,
    backgroundColor: '#f1f3f5',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButtonText: { fontSize: 18 },
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
});
