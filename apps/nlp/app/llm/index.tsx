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
import { useLLMChatSession, models, llm, cv } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getImage, skImageToBuffer } from '../../utils';

const MODEL = models.llm.LFM2_5_VL_1_6B;
const SYSTEM_PROMPT = 'You are a helpful AI assistant with tool calling capabilities.';
const INITIAL_MESSAGES: llm.ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];
const GENERATION_CONFIG = { temperature: 0.7, maxNewTokens: 512, echo: false };

const TOOLS: llm.ToolDefinition[] = [];
[
  {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Returns the current device date and time in string format.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
    execute: () => {
      return `Current time: ${new Date().toLocaleString()}`;
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_location',
      description: 'Returns the user current location (city and country).',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
    execute: () => {
      return JSON.stringify({ city: 'San Francisco', state: 'California', country: 'USA' });
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Returns the current weather conditions for a given city.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'The city to get weather for' },
        },
        required: ['city'],
      },
    },
    execute: (args: Record<string, any>) => {
      const city = String(args.city);
      if (city.toLowerCase().includes('san francisco')) {
        return JSON.stringify({
          city: 'San Francisco',
          temperatureC: 13,
          condition: 'Foggy, chilly with light drizzle',
          humidity: '88%',
          windKmh: 24,
        });
      }
      return JSON.stringify({
        city,
        temperatureC: 22,
        condition: 'Partly sunny and pleasant',
        humidity: '50%',
        windKmh: 10,
      });
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_outfit_recommendation',
      description: 'Recommends appropriate clothing based on weather condition and temperature.',
      parameters: {
        type: 'object',
        properties: {
          condition: { type: 'string', description: 'The weather condition (e.g. rainy, sunny)' },
          temperatureC: { type: 'number', description: 'Temperature in degrees Celsius' },
        },
        required: ['condition', 'temperatureC'],
      },
    },
    execute: (args: Record<string, any>) => {
      const temp = Number(args.temperatureC);
      const condition = String(args.condition).toLowerCase();
      let advice = '';
      if (temp < 15) {
        advice += 'Wear a windbreaker or warm fleece jacket with long pants.';
      } else if (temp < 22) {
        advice += 'A light sweater or long-sleeve shirt is ideal.';
      } else {
        advice += 'T-shirt and shorts or light clothing are recommended.';
      }
      if (condition.includes('rain') || condition.includes('drizzle')) {
        advice += ' Bring a compact umbrella and waterproof shoes.';
      }
      return advice;
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate',
      description: 'Performs basic arithmetic operations.',
      parameters: {
        type: 'object',
        properties: {
          operation: { type: 'string', enum: ['add', 'subtract', 'multiply', 'divide'] },
          a: { type: 'number' },
          b: { type: 'number' },
        },
        required: ['operation', 'a', 'b'],
      },
    },
    execute: (args: Record<string, any>) => {
      const a = Number(args.a);
      const b = Number(args.b);
      switch (args.operation) {
        case 'add':
          return `Result: ${a + b}`;
        case 'subtract':
          return `Result: ${a - b}`;
        case 'multiply':
          return `Result: ${a * b}`;
        case 'divide':
          return b !== 0 ? `Result: ${a / b}` : 'Error: Division by zero';
        default:
          return 'Error: Unknown operation';
      }
    },
  },
];

type Turn = {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  imageUri?: string;
  stats?: llm.LLMGenerationStats;
  toolCalls?: readonly llm.ToolCall[];
};

function formatStats(stats: llm.LLMGenerationStats): string {
  const decodeMs = stats.inferenceEndMs - stats.firstTokenMs;
  const tokensPerSec = decodeMs > 0 ? (stats.numGeneratedTokens / decodeMs) * 1000 : 0;
  const totalMs = stats.inferenceEndMs - stats.inferenceStartMs;
  const ttftMs = stats.firstTokenMs - stats.inferenceStartMs;
  return (
    `${stats.numGeneratedTokens} tokens · ` +
    `${tokensPerSec.toFixed(1)} tok/s · ` +
    `${ttftMs.toFixed(0)}ms ttft · ` +
    `${(totalMs / 1000).toFixed(2)}s`
  );
}

// --- LFM (Liquid Foundation Models) Tool Calling ---
export const LFM_TOOL_STOP_REGEX = /(?:<\|tool_call_end\|>|<\/tool_call>)/;

export function parseLfmToolCalls(text: string): llm.ToolParserResult | undefined {
  const match = text.match(/<\|tool_call_start\|>\[(.*?)\]<\|tool_call_end\|>/s);
  if (!match) return undefined;

  const toolCalls: llm.ToolCall[] = [];
  for (const [, name, rawArgs] of match[1]!.matchAll(/(\w+)\((.*?)\)/g)) {
    const args: Record<string, unknown> = {};
    for (const [, k, , sq, dq, raw] of rawArgs!.matchAll(
      /(\w+)\s*=\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|([^,)]+))/g
    )) {
      const val = sq ?? dq ?? raw?.trim();
      try {
        args[k!] = JSON.parse(val ?? '');
      } catch {
        args[k!] = val;
      }
    }
    toolCalls.push({ type: 'function', function: { name: name!, arguments: args } });
  }

  const textContent = text.replace(/<\|tool_call_start\|>[\s\S]*?<\|tool_call_end\|>/g, '').trim();
  return { toolCalls, textContent: textContent || undefined };
}

// --- Gemma (Gemma 3 / 4) Tool Calling ---
export const GEMMA_TOOL_STOP_REGEX = /(?:<tool_call\|>|<turn\|>)/;

export function parseGemmaToolCalls(text: string): llm.ToolParserResult | undefined {
  const callRegex = /<\|tool_call>call:([a-zA-Z0-9_-]+)\{([\s\S]*?)\}(?:<tool_call\|>)?/g;

  const toolCalls: llm.ToolCall[] = [];
  for (const match of text.matchAll(callRegex)) {
    const name = match[1]!;
    const rawArgs = match[2]?.trim() ?? '';
    let args: Record<string, unknown> = {};

    if (rawArgs) {
      try {
        const normalized = rawArgs.replace(/<\|"\|>/g, '"').replace(/([a-zA-Z0-9_-]+):/g, '"$1":');
        args = JSON.parse(`{${normalized}}`);
      } catch {
        args = {};
      }
    }

    toolCalls.push({ type: 'function', function: { name, arguments: args } });
  }

  if (toolCalls.length === 0) return undefined;
  const textContent = text
    .replace(callRegex, '')
    .replace(/<\|channel>thought[\s\S]*?<channel\|>/g, '')
    .replace(/<\|?tool_call\|?>/g, '')
    .replace(/<turn\|>/g, '')
    .trim();

  return { toolCalls, textContent: textContent || undefined };
}

// --- Hammer (Hammer 2.1) Tool Calling ---
export const HAMMER_TOOL_STOP_REGEX = /(?:<\|im_end\|>)/;

export function parseHammerToolCalls(text: string): llm.ToolParserResult | undefined {
  const jsonMatch =
    text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ?? text.match(/\[\s*\{[\s\S]*\}\s*\]/);
  const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : text.trim();

  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed) || parsed.length === 0) return undefined;

    const toolCalls: llm.ToolCall[] = [];
    for (const item of parsed) {
      if (item && typeof item === 'object' && typeof item.name === 'string') {
        toolCalls.push({
          type: 'function',
          function: {
            name: item.name,
            arguments: item.arguments && typeof item.arguments === 'object' ? item.arguments : {},
          },
        });
      }
    }

    if (toolCalls.length === 0) return undefined;
    const textContent = text.replace(jsonMatch ? jsonMatch[0] : jsonStr, '').trim();
    return { toolCalls, textContent: textContent || undefined };
  } catch {
    return undefined;
  }
}

function LLMContent() {
  const { isReady, downloadProgress, error, sendMessage, stop } = useLLMChatSession(MODEL, {
    initialMessages: INITIAL_MESSAGES,
    generationConfig: GENERATION_CONFIG,
    stopRegex: GEMMA_TOOL_STOP_REGEX,
    toolOpts: {
      tools: TOOLS,
      parseToolCalls: parseGemmaToolCalls,
    },
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

      const result = await sendMessage(payload, (token) => {
        setStreamingResponse((prev) => (prev !== null ? prev + token : token));
      });

      const generatedTurns: Turn[] = result.messages
        .filter(
          (m): m is Extract<typeof m, { role: 'assistant' | 'tool' }> =>
            m.role === 'assistant' || m.role === 'tool'
        )
        .map((m, idx) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : '',
          stats: result.stats[idx],
          toolCalls: m.role === 'assistant' ? m.toolCalls : undefined,
        }));

      setTurns((prev) => [...prev, ...generatedTurns]);
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
});
