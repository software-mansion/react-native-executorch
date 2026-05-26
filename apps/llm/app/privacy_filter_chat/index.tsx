import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { models, PiiEntity, usePrivacyFilter } from 'react-native-executorch';

import ColorPalette from '../../colors';
import { buildSegments, matchEntities, Segment } from '../../utils/piiMatching';
import { SECTIONS, sectionForLabel } from '../../utils/piiCategories';

const privacyFilter = models.privacy_filter;

interface Message {
  id: string;
  raw: string;
  segments: Segment[];
  entityCount: number;
  inferenceMs: number;
}

function RedactedChip({ label }: { label: string }) {
  const meta = SECTIONS[sectionForLabel(label)];
  const colorStyle = { color: meta.chipText };
  return (
    <Text style={[styles.redactedChip, colorStyle]}>
      <Text style={colorStyle}>[REDACTED:</Text>
      <Text style={[colorStyle, styles.redactedLabel]}>{label}</Text>
      <Text style={colorStyle}>]</Text>
    </Text>
  );
}

function RawBubble({ segments }: { segments: Segment[] }) {
  return (
    <View style={[styles.bubble, styles.bubbleRaw]}>
      <Text style={styles.bubbleHeader}>YOU TYPED</Text>
      <Text style={styles.bubbleText}>
        {segments.map((seg, i) =>
          seg.label ? (
            <Text
              key={i}
              style={[
                styles.highlight,
                { backgroundColor: SECTIONS[sectionForLabel(seg.label)].fill },
              ]}
            >
              {seg.text}
            </Text>
          ) : (
            <Text key={i}>{seg.text}</Text>
          )
        )}
      </Text>
    </View>
  );
}

function RedactedBubble({
  segments,
  count,
  ms,
}: {
  segments: Segment[];
  count: number;
  ms: number;
}) {
  return (
    <View style={[styles.bubble, styles.bubbleRedacted]}>
      <View style={styles.redactedHeaderRow}>
        <Text style={[styles.bubbleHeader, { color: '#C5DDD5' }]}>
          SENT TO LLM
        </Text>
        <View style={styles.metaPill}>
          <Text style={styles.metaPillText}>
            {count} redacted · {ms} ms
          </Text>
        </View>
      </View>
      <Text style={[styles.bubbleText, { color: '#EAF2EE' }]}>
        {segments.map((seg, i) =>
          seg.label ? (
            <RedactedChip key={i} label={seg.label} />
          ) : (
            <Text key={i}>{seg.text}</Text>
          )
        )}
      </Text>
    </View>
  );
}

function MessagePair({ msg }: { msg: Message }) {
  return (
    <Animated.View
      entering={FadeInUp.duration(260).springify().damping(18)}
      style={styles.pair}
    >
      <RawBubble segments={msg.segments} />
      <View style={styles.arrowRow}>
        <View style={styles.arrowLine} />
        <Text style={styles.arrowLabel}>redact</Text>
        <View style={styles.arrowLine} />
      </View>
      <RedactedBubble
        segments={msg.segments}
        count={msg.entityCount}
        ms={msg.inferenceMs}
      />
    </Animated.View>
  );
}

function PrivacyFilterChatScreen() {
  const { bottom } = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [runError, setRunError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const filter = usePrivacyFilter({ model: privacyFilter.nemotron() });

  const onSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !filter.isReady || filter.isGenerating) return;
    setRunError(null);
    const startedAt = Date.now();
    try {
      const entities: PiiEntity[] = await filter.generate(text);
      const elapsed = Date.now() - startedAt;
      const matches = matchEntities(text, entities);
      const segments = buildSegments(text, matches);
      const entityCount = segments.filter((s) => s.label !== null).length;
      const msg: Message = {
        id: `${Date.now()}`,
        raw: text,
        segments,
        entityCount,
        inferenceMs: elapsed,
      };
      setMessages((prev) => [...prev, msg]);
      setInput('');
      requestAnimationFrame(() =>
        scrollRef.current?.scrollToEnd({ animated: true })
      );
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e));
    }
  }, [filter, input]);

  const sendDisabled = !filter.isReady || filter.isGenerating || !input.trim();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={styles.headerCard}>
        <View style={styles.modelPill}>
          <View style={styles.modelPillDot} />
          <Text style={styles.modelPillText}>Nemotron · on-device</Text>
        </View>
        <Text style={styles.tagline}>
          Stop sending PII to cloud LLMs. Detect & redact, locally.
        </Text>
      </View>

      {filter.error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            Load error: {filter.error.message}
          </Text>
        </View>
      )}

      {!filter.isReady && !filter.error && (
        <View style={styles.centerBlock}>
          <ActivityIndicator color={ColorPalette.primary} />
          <Text style={styles.muted}>
            Loading model… {Math.round((filter.downloadProgress ?? 0) * 100)}%
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Try sending a message</Text>
            {/* <Text style={styles.emptyHint}>{hint}</Text> */}
          </View>
        ) : (
          messages.map((m) => <MessagePair key={m.id} msg={m} />)
        )}
        {runError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Run error: {runError}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: bottom + 8 }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message with some PII…"
          placeholderTextColor="#9B9588"
          style={styles.input}
          multiline
          editable={filter.isReady && !filter.isGenerating}
        />
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.sendButton, sendDisabled && styles.sendDisabled]}
          onPress={onSend}
          disabled={sendDisabled}
        >
          {filter.isGenerating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function PrivacyFilterChatWrapper() {
  const isFocused = useIsFocused();
  return isFocused ? <PrivacyFilterChatScreen /> : null;
}

const CANVAS = '#F7F6F2';
const INK = '#13231C';
const ACCENT = '#0F4F3F';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CANVAS,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFEDE6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  modelPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  modelPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: INK,
    letterSpacing: 0.2,
  },
  tagline: {
    fontSize: 13,
    color: '#3A4A42',
    fontWeight: '500',
    lineHeight: 18,
  },
  thread: {
    flex: 1,
  },
  threadContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 18,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  emptyHint: {
    fontSize: 12,
    color: '#6E6A60',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 17,
  },
  pair: {
    gap: 8,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  arrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D9D5CB',
  },
  arrowLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#9B9588',
  },
  bubble: {
    borderRadius: 14,
    padding: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bubbleRaw: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ECE8DD',
  },
  bubbleRedacted: {
    backgroundColor: '#13231C',
  },
  bubbleHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#9B9588',
  },
  redactedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaPill: {
    backgroundColor: '#1F3A30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  metaPillText: {
    color: '#C5DDD5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#13231C',
  },
  highlight: {
    fontWeight: '600',
    borderRadius: 3,
  },
  redactedChip: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  redactedLabel: {
    fontWeight: '800',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ECE8DD',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#F1EEE6',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: INK,
  },
  sendButton: {
    backgroundColor: ACCENT,
    borderRadius: 18,
    paddingHorizontal: 18,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  sendDisabled: {
    opacity: 0.5,
  },
  centerBlock: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  muted: {
    color: '#6E6A60',
    fontSize: 12,
  },
  errorBanner: {
    marginHorizontal: 16,
    backgroundColor: '#fdecea',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    color: '#a94442',
    fontSize: 12,
  },
});
