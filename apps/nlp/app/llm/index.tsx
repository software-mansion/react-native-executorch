import React, { useMemo, useRef, useState, type ComponentRef } from 'react';
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
  Modal,
} from 'react-native';
import { Skia } from '@shopify/react-native-skia';
import RNBlobUtil from 'react-native-blob-util';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLLMChatSession, type llm, type cv } from 'react-native-executorch';
import { decodeAudioData } from 'react-native-audio-api';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';
import { Button } from '../../components/Button';
import { getImage, skImageToBuffer } from '../../utils';
import { LLM_MODELS, type LLMModelConfig, type LLMBackend } from '../../constants/llm';

type Turn = {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  imageUri?: string;
  audioName?: string;
  stats?: llm.LLMGenerationStats;
  toolCalls?: readonly llm.ToolCall[];
};

function formatStats(stats: llm.LLMGenerationStats): string {
  const totalMs = stats.durationMs + stats.prefill.durationMs;
  return (
    `${stats.numTokens} tokens · ` +
    `${stats.tokensPerSecond.toFixed(1)} tok/s · ` +
    `${stats.prefill.durationMs.toFixed(0)}ms prefill · ` +
    `${(totalMs / 1000).toFixed(2)}s`
  );
}

function LLMContent() {
  const insets = useSafeAreaInsets();
  const [selectedBackend, setSelectedBackend] = useState<LLMBackend>('xnnpack');

  const availableBackends: ModelOption[] = useMemo(() => {
    const list: { label: string; value: LLMBackend }[] = [{ label: 'XNNPACK', value: 'xnnpack' }];
    if (Platform.OS === 'ios') {
      list.push({ label: 'MLX (Apple GPU)', value: 'mlx' });
    }
    if (Platform.OS === 'android') {
      list.push({ label: 'Vulkan (Android GPU)', value: 'vulkan' });
    }
    return list;
  }, []);

  const modelsForBackend = useMemo(
    () =>
      LLM_MODELS.filter(
        (m) => m.backend === selectedBackend && (!m.iosOnly || Platform.OS === 'ios')
      ),
    [selectedBackend]
  );

  const [selectedModelId, setSelectedModelId] = useState<string>(
    () => modelsForBackend[0]?.id ?? LLM_MODELS[0]!.id
  );
  const [isDownloadStarted, setIsDownloadStarted] = useState(false);

  const activeModel: LLMModelConfig = useMemo(
    () =>
      modelsForBackend.find((m) => m.id === selectedModelId) ??
      modelsForBackend[0] ??
      LLM_MODELS[0]!,
    [modelsForBackend, selectedModelId]
  );

  const modelOptions: ModelOption[] = useMemo(
    () =>
      modelsForBackend.map((m) => ({
        label: m.name,
        value: m.id,
      })),
    [modelsForBackend]
  );

  const initialMessages: llm.ChatMessage[] = useMemo(
    () => (activeModel.systemPrompt ? [{ role: 'system', content: activeModel.systemPrompt }] : []),
    [activeModel]
  );

  const { isReady, downloadProgress, error, sendMessage, stop, resource, getKVCacheState } =
    useLLMChatSession(activeModel.model, {
      initialMessages,
      generationConfig: activeModel.generationConfig,
      stopRegex: activeModel.stopRegex,
      toolOpts: activeModel.toolOpts,
      preventLoad: !isDownloadStarted,
    });

  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [streamingResponse, setStreamingResponse] = useState<string | null>(null);

  let kvCacheState: llm.LLMKVCacheState | null = null;
  if (isReady && getKVCacheState) {
    try {
      kvCacheState = getKVCacheState();
    } catch {
      kvCacheState = null;
    }
  }

  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const isGenerating = streamingResponse !== null;

  const [attachedImage, setAttachedImage] = useState<{
    uri: string;
    name: string;
    buffer: cv.ImageBuffer;
  } | null>(null);

  const [attachedAudio, setAttachedAudio] = useState<{
    uri: string;
    name: string;
    samples: Float32Array;
  } | null>(null);

  const [isAudioModalVisible, setIsAudioModalVisible] = useState(false);
  const [audioUrl, setAudioUrl] = useState('https://models.silero.ai/vad_models/en.wav');
  const [isDecodingAudio, setIsDecodingAudio] = useState(false);

  const supportsImages = Boolean(activeModel.model.modalities?.includes('image'));
  const supportsAudio = Boolean(activeModel.model.modalities?.includes('audio'));

  const handleBackendChange = (newBackend: LLMBackend) => {
    if (newBackend === selectedBackend) return;
    setSelectedBackend(newBackend);
    const firstForBackend = LLM_MODELS.find(
      (m) => m.backend === newBackend && (!m.iosOnly || Platform.OS === 'ios')
    );
    if (firstForBackend) {
      setSelectedModelId(firstForBackend.id);
    }
    setIsDownloadStarted(false);
    setTurns([]);
    setStreamingResponse(null);
    setAttachedImage(null);
    setAttachedAudio(null);
    setIsAudioModalVisible(false);
    setInput('');
  };

  const handleModelChange = (newModelId: string) => {
    if (newModelId === selectedModelId) return;
    setSelectedModelId(newModelId);
    setIsDownloadStarted(false);
    setTurns([]);
    setStreamingResponse(null);
    setAttachedImage(null);
    setAttachedAudio(null);
    setIsAudioModalVisible(false);
    setInput('');
  };

  const handleUnlinkModel = () => {
    if (!resource) return;

    Alert.alert(
      'Delete Cached Files',
      'Are you sure you want to delete the cached model files from device storage?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const pathsToUnlink = [
                resource.modelPath,
                resource.tokenizerPath,
                resource.tokenizerConfigPath,
              ].filter(Boolean);

              for (const path of pathsToUnlink) {
                if (path && (await RNBlobUtil.fs.exists(path))) {
                  await RNBlobUtil.fs.unlink(path);
                }
              }
              setIsDownloadStarted(false);
              setTurns([]);
              setStreamingResponse(null);
              setAttachedImage(null);
              setAttachedAudio(null);
              setIsAudioModalVisible(false);
              setInput('');
              Alert.alert('Deleted', 'Model files deleted from device storage.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete model files');
            }
          },
        },
      ]
    );
  };

  const handlePickGalleryImage = async () => {
    if (!supportsImages) return;
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

  const handleAttachAudio = async () => {
    const trimmed = audioUrl.trim();
    if (!trimmed) return;
    setIsDecodingAudio(true);
    try {
      const audioBuffer = await decodeAudioData(trimmed, 16000);
      const samples = audioBuffer.getChannelData(0);
      const durationSec = (samples.length / 16000).toFixed(1);
      const filename = trimmed.split('/').pop() || 'audio.wav';
      setAttachedAudio({
        uri: trimmed,
        name: `${filename} (${durationSec}s)`,
        samples,
      });
      setIsAudioModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to decode audio URL');
    } finally {
      setIsDecodingAudio(false);
    }
  };

  const handleSend = async () => {
    const textMessage = input.trim();
    if ((!textMessage && !attachedImage && !attachedAudio) || !sendMessage || isGenerating) return;

    const currentImage = attachedImage;
    const currentAudio = attachedAudio;
    setAttachedImage(null);
    setAttachedAudio(null);
    setInput('');
    setStreamingResponse('');

    setTurns((prev) => [
      ...prev,
      {
        role: 'user',
        content: textMessage,
        imageUri: currentImage?.uri,
        audioName: currentAudio?.name,
      },
    ]);

    try {
      let payload;
      if (currentImage || currentAudio) {
        const mediaItems: (string | llm.ChatMediaInput)[] = [];
        if (currentImage) {
          mediaItems.push({ kind: 'image' as const, image: currentImage.buffer });
        }
        if (currentAudio) {
          mediaItems.push({ kind: 'audio' as const, audio: currentAudio.samples });
        }
        const defaultPrompt = currentAudio ? "What's in this audio?" : "What's in this image?";
        mediaItems.push(textMessage || defaultPrompt);
        payload = mediaItems;
      } else {
        payload = textMessage;
      }

      const result = await sendMessage(payload, (token) => {
        setStreamingResponse((prev) => (prev !== null ? prev + token : token));
      });

      let assistantIdx = 0;
      const generatedTurns: Turn[] = result.messages
        .filter(
          (m): m is Extract<typeof m, { role: 'assistant' | 'tool' }> =>
            m.role === 'assistant' || m.role === 'tool'
        )
        .map((m) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : '',
          stats: m.role === 'assistant' ? result.stats[assistantIdx++] : undefined,
          toolCalls: m.role === 'assistant' ? m.toolCalls : undefined,
        }));

      if (result.finishReason === 'maxToolTurns') {
        const lastGenerated = generatedTurns[generatedTurns.length - 1];
        if (!lastGenerated || lastGenerated.role === 'tool' || lastGenerated.toolCalls) {
          generatedTurns.push({
            role: 'assistant',
            content:
              '⚠️ Tool execution reached the maximum allowed turns without a final response.',
          });
        }
      }

      setTurns((prev) => [...prev, ...generatedTurns]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to generate response');
    } finally {
      setStreamingResponse(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        {availableBackends.length > 1 && (
          <ModelPicker
            label="Backend"
            options={availableBackends}
            selectedValue={selectedBackend}
            onValueChange={handleBackendChange}
          />
        )}
        <ModelPicker
          label="Model"
          options={modelOptions}
          selectedValue={selectedModelId}
          onValueChange={handleModelChange}
        />
        {resource && (
          <TouchableOpacity
            style={styles.unlinkButton}
            onPress={handleUnlinkModel}
            activeOpacity={0.7}
          >
            <Text style={styles.unlinkButtonText}>🗑️ Delete Cached Files</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isDownloadStarted && (
        <View style={styles.centered}>
          <Text style={styles.modelTitle}>{activeModel.name}</Text>
          {activeModel.systemPrompt && (
            <Text style={styles.modelPrompt}>Prompt: "{activeModel.systemPrompt}"</Text>
          )}
          <View style={styles.badgesRow}>
            {activeModel.toolOpts && (
              <View style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>🛠️ Tool Calling</Text>
              </View>
            )}
            {supportsImages && (
              <View style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>📷 Vision Multimodal</Text>
              </View>
            )}
          </View>
          <View style={styles.downloadButtonContainer}>
            <Button title="Download & Load Model" onPress={() => setIsDownloadStarted(true)} />
          </View>
        </View>
      )}

      {isDownloadStarted && error && (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Failed to load model</Text>
          <Text style={styles.errorBody}>{error.message}</Text>
        </View>
      )}

      {isDownloadStarted && !error && !isReady && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0070f3" />
          <Text style={styles.loadingText}>
            {downloadProgress < 100
              ? `Downloading model… ${downloadProgress.toFixed(0)}%`
              : 'Loading model into memory…'}
          </Text>
        </View>
      )}

      {isReady && (
        <>
          {kvCacheState && (
            <View style={styles.contextBar}>
              <View style={styles.contextBarHeader}>
                <Text style={styles.contextLabel}>Context Window</Text>
                <Text style={styles.contextTokens}>
                  {kvCacheState.pos} / {kvCacheState.maxContextLen} tokens (
                  {(kvCacheState.usageRatio * 100).toFixed(1)}%)
                </Text>
              </View>
              <View style={styles.contextTrack}>
                <View
                  style={[
                    styles.contextFill,
                    kvCacheState.usageRatio > 0.85
                      ? styles.contextFillRed
                      : kvCacheState.usageRatio > 0.6
                        ? styles.contextFillYellow
                        : styles.contextFillGreen,

                    { width: `${Math.min(100, Math.max(0, kvCacheState.usageRatio * 100))}%` },
                  ]}
                />
              </View>
            </View>
          )}

          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {turns.length === 0 && streamingResponse === null && (
              <Text style={styles.placeholder}>
                Ask {activeModel.name} anything
                {supportsImages && supportsAudio
                  ? ' or attach an image or audio.'
                  : supportsImages
                    ? ' or attach an image.'
                    : supportsAudio
                      ? ' or attach audio.'
                      : '.'}
              </Text>
            )}
            {turns.map((turn, idx) => (
              <View key={idx} style={styles.turn}>
                <View
                  style={[
                    styles.bubble,
                    turn.role === 'user'
                      ? styles.userBubble
                      : turn.role === 'tool'
                        ? styles.toolBubble
                        : styles.assistantBubble,
                  ]}
                >
                  {turn.imageUri && (
                    <RNImage source={{ uri: turn.imageUri }} style={styles.turnThumbnail} />
                  )}
                  {turn.audioName && (
                    <View style={styles.turnAudioBadge}>
                      <Text style={styles.turnAudioIcon}>🎙️</Text>
                      <Text style={styles.turnAudioText} numberOfLines={1}>
                        {turn.audioName}
                      </Text>
                    </View>
                  )}
                  {turn.toolCalls && turn.toolCalls.length > 0 && (
                    <View style={styles.toolCallBlock}>
                      <Text style={styles.toolCallTitle}>🛠️ Tool Call:</Text>
                      {turn.toolCalls.map((tc, tcIdx) => (
                        <Text key={tcIdx} style={styles.toolCallDetail}>
                          {tc.function.name}({JSON.stringify(tc.function.arguments)})
                        </Text>
                      ))}
                    </View>
                  )}
                  <Text
                    style={
                      turn.role === 'user'
                        ? styles.userText
                        : turn.role === 'tool'
                          ? styles.toolText
                          : styles.assistantText
                    }
                  >
                    {turn.content || (turn.toolCalls ? '' : '…')}
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

          {attachedAudio && (
            <View style={styles.attachmentBar}>
              <View style={styles.audioPreviewBadge}>
                <Text style={styles.audioIconText}>🎙️</Text>
              </View>
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {attachedAudio.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeAttachmentButton}
                onPress={() => setAttachedAudio(null)}
              >
                <Text style={styles.removeAttachmentText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.inputRow, { paddingBottom: Math.max(12, insets.bottom) }]}>
            {supportsImages && (
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={handlePickGalleryImage}
                disabled={isGenerating}
              >
                <Text style={styles.galleryButtonText}>📷</Text>
              </TouchableOpacity>
            )}
            {supportsAudio && (
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={() => setIsAudioModalVisible(true)}
                disabled={isGenerating}
              >
                <Text style={styles.galleryButtonText}>🎙️</Text>
              </TouchableOpacity>
            )}
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
                  !input.trim() && !attachedImage && !attachedAudio && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!input.trim() && !attachedImage && !attachedAudio}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            )}
          </View>

          <Modal
            visible={isAudioModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => {
              if (!isDecodingAudio) setIsAudioModalVisible(false);
            }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Attach Audio URL</Text>
                <Text style={styles.modalDescription}>
                  Enter a direct URL to a WAV or audio file (will be decoded at 16kHz):
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={audioUrl}
                  onChangeText={setAudioUrl}
                  placeholder="https://.../audio.wav"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isDecodingAudio}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setIsAudioModalVisible(false)}
                    disabled={isDecodingAudio}
                  >
                    <Text style={styles.modalButtonCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.modalButtonConfirm,
                      (!audioUrl.trim() || isDecodingAudio) && styles.sendButtonDisabled,
                    ]}
                    onPress={handleAttachAudio}
                    disabled={!audioUrl.trim() || isDecodingAudio}
                  >
                    {isDecodingAudio ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalButtonConfirmText}>Attach</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  unlinkButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff0f0',
    borderColor: '#ffc9c9',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
    marginLeft: 4,
  },
  unlinkButtonText: {
    color: '#e03131',
    fontSize: 12,
    fontWeight: '600',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  modelPrompt: {
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  featureBadge: {
    backgroundColor: '#e7f5ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0ebff',
  },
  featureBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1971c2',
  },
  downloadButtonContainer: {
    width: '100%',
    maxWidth: 280,
    height: 48,
    marginTop: 8,
  },
  loadingText: { marginTop: 16, fontSize: 15, color: '#495057', fontWeight: '600' },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#e03131', marginBottom: 8 },
  errorBody: { fontSize: 13, color: '#868e96', textAlign: 'center', marginBottom: 16 },
  contextBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  contextBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  contextTokens: {
    fontSize: 12,
    color: '#868e96',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  contextTrack: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  contextFill: {
    height: '100%',
    borderRadius: 2,
  },
  contextFillGreen: {
    backgroundColor: '#10b981',
  },
  contextFillYellow: {
    backgroundColor: '#f59e0b',
  },
  contextFillRed: {
    backgroundColor: '#ef4444',
  },
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
  toolBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e7f5ff',
    borderWidth: 1,
    borderColor: '#d0ebff',
  },
  userText: { color: '#fff', fontSize: 15, lineHeight: 21 },
  assistantText: { color: '#212529', fontSize: 15, lineHeight: 21 },
  toolText: {
    color: '#1971c2',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  toolCallBlock: {
    marginBottom: 6,
    padding: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  toolCallTitle: { fontSize: 12, fontWeight: '600', color: '#495057', marginBottom: 2 },
  toolCallDetail: {
    fontSize: 12,
    color: '#e64980',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
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
  turnAudioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
    gap: 6,
  },
  turnAudioIcon: { fontSize: 14 },
  turnAudioText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  audioPreviewBadge: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#e7f5ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioIconText: { fontSize: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 14,
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: '#f1f3f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#212529',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#e9ecef',
  },
  modalButtonCancelText: {
    color: '#495057',
    fontWeight: '600',
    fontSize: 14,
  },
  modalButtonConfirm: {
    backgroundColor: '#0070f3',
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
