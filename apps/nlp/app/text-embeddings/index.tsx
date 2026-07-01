import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTextEmbeddings, models, type TextEmbeddingsModel } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ModelStatus } from '../../components/ModelStatus';
import { Button } from '../../components/Button';
import { theme } from '../../theme';

const MODELS: { label: string; value: TextEmbeddingsModel }[] = [
  { label: 'MiniLM L6', value: models.textEmbeddings.ALL_MINILM_L6_V2 },
  { label: 'MPNet Base', value: models.textEmbeddings.ALL_MPNET_BASE_V2 },
  { label: 'MultiQA MiniLM', value: models.textEmbeddings.MULTI_QA_MINILM_L6_COS_V1 },
  { label: 'MultiQA MPNet', value: models.textEmbeddings.MULTI_QA_MPNET_BASE_DOT_V1 },
  { label: 'Paraphrase ML', value: models.textEmbeddings.PARAPHRASE_MULTILINGUAL_MINILM_L12_V2 },
  { label: 'DistilUSE ML', value: models.textEmbeddings.DISTILUSE_BASE_MULTILINGUAL_CASED_V2 },
  { label: 'CLIP Text', value: models.textEmbeddings.CLIP_VIT_BASE_PATCH32_TEXT },
];

const STARTER_SENTENCES = [
  'The weather is lovely today.',
  "It's so sunny outside!",
  'He drove to the stadium.',
  'A man is eating a piece of bread.',
  'The cat sleeps on the warm windowsill.',
];

// These models output L2-normalized embeddings, so cosine similarity is the dot
// product.
const cosine = (a: Float32Array, b: Float32Array) => {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
  }
  return dot;
};

type Entry = { sentence: string; embedding: Float32Array };
type Match = { sentence: string; similarity: number };

const isDisposedError = (msg: string) => /disposed/i.test(msg);

function TextEmbeddingsContent() {
  const [selected, setSelected] = useState(0);
  const { isReady, downloadProgress, error, forward } = useTextEmbeddings(MODELS[selected]!.value);

  const [library, setLibrary] = useState<Entry[]>([]);
  const [input, setInput] = useState('');
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [queryText, setQueryText] = useState('');
  const [busy, setBusy] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [embedMs, setEmbedMs] = useState<number | null>(null);

  const ready = isReady && !!forward;

  // Re-seed the library with starter sentences whenever the model changes.
  useEffect(() => {
    if (!ready || !forward) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      setRunError(null);
      try {
        const entries: Entry[] = [];
        for (const sentence of STARTER_SENTENCES) {
          const embedding = await forward(sentence);
          if (cancelled) return;
          entries.push({ sentence, embedding });
        }
        setLibrary(entries);
      } catch (e: any) {
        if (!cancelled) setRunError(e?.message ?? String(e));
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [forward, ready]);

  const selectModel = (i: number) => {
    if (i === selected) return;
    setSelected(i);
    setLibrary([]);
    setMatches(null);
    setQueryText('');
    setEmbedMs(null);
  };

  const findSimilar = async () => {
    if (!forward || !input.trim() || library.length === 0) return;
    setBusy(true);
    setRunError(null);
    try {
      const start = Date.now();
      const q = await forward(input.trim());
      setEmbedMs(Date.now() - start);
      const ranked = library
        .map(({ sentence, embedding }) => ({ sentence, similarity: cosine(q, embedding) }))
        .sort((a, b) => b.similarity - a.similarity);
      setQueryText(input.trim());
      setMatches(ranked);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      if (!isDisposedError(msg)) setRunError(msg);
    } finally {
      setBusy(false);
    }
  };

  const addToLibrary = async () => {
    if (!forward || !input.trim()) return;
    setBusy(true);
    setRunError(null);
    try {
      const start = Date.now();
      const embedding = await forward(input.trim());
      setEmbedMs(Date.now() - start);
      setLibrary((prev) => [...prev, { sentence: input.trim(), embedding }]);
      setInput('');
      setMatches(null);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      if (!isDisposedError(msg)) setRunError(msg);
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (i: number) => {
    setLibrary((prev) => prev.filter((_, idx) => idx !== i));
    setMatches(null);
  };

  const clearLibrary = () => {
    setLibrary([]);
    setMatches(null);
    setQueryText('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Text Embeddings</Text>
          <Text style={styles.cardDescription}>
            Semantic search playground. Build a library of sentences, then find the ones closest in
            meaning to your query using cosine similarity over the embeddings.
          </Text>

          <Text style={styles.fieldLabel}>Model</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {MODELS.map((m, i) => (
              <TouchableOpacity
                key={m.label}
                style={[styles.chip, i === selected && styles.chipActive]}
                onPress={() => selectModel(i)}
              >
                <Text style={[styles.chipText, i === selected && styles.chipTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ModelStatus
            isReady={isReady}
            downloadProgress={downloadProgress}
            error={error ? error.message : null}
            modelTypeLabel="model"
          />
        </View>

        {runError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{runError}</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.libraryHeader}>
            <Text style={styles.sectionTitle}>Sentence library ({library.length})</Text>
            {library.length > 0 && (
              <TouchableOpacity onPress={clearLibrary}>
                <Text style={styles.clearLink}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          {library.length === 0 ? (
            <Text style={styles.emptyText}>
              {ready ? 'Library is empty — add a sentence below.' : 'Waiting for the model…'}
            </Text>
          ) : (
            library.map((item, i) => (
              <View key={`${item.sentence}-${i}`} style={styles.libraryRow}>
                <Text style={styles.librarySentence}>{item.sentence}</Text>
                <TouchableOpacity onPress={() => removeAt(i)} hitSlop={8}>
                  <Text style={styles.removeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Try your sentence</Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            autoCapitalize="none"
            placeholder="Type a sentence…"
            placeholderTextColor="#999"
            multiline
          />
          <View style={styles.buttonRow}>
            <Button
              title="Find similar"
              onPress={findSimilar}
              disabled={!ready || !input.trim() || library.length === 0}
              loading={busy}
            />
            <Button
              title="Add to library"
              variant="secondary"
              onPress={addToLibrary}
              disabled={!ready || !input.trim()}
            />
          </View>
          {embedMs !== null && <Text style={styles.statsText}>Embedding time: {embedMs} ms</Text>}
        </View>

        {matches && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ranked by similarity</Text>
            <Text style={styles.queryText}>to “{queryText}”</Text>
            {matches.map((m, i) => {
              const pct = Math.max(0, Math.min(1, m.similarity)) * 100;
              return (
                <View key={`${m.sentence}-${i}`} style={styles.matchRow}>
                  <View style={styles.matchHeader}>
                    <Text style={[styles.matchSentence, i === 0 && styles.matchTop]}>
                      {m.sentence}
                    </Text>
                    <Text style={styles.matchScore}>{m.similarity.toFixed(3)}</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[styles.barFill, { width: `${pct}%` }, i === 0 && styles.barFillTop]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function TextEmbeddingsScreen() {
  return (
    <ScreenWrapper>
      <TextEmbeddingsContent />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.large, paddingBottom: 40 },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.large,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.lightBorder,
  },
  cardTitle: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
    color: theme.colors.strongPrimary,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPlaceholder,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipRow: { gap: 8, paddingBottom: 4, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
    borderWidth: 1,
    borderColor: theme.colors.lightBorder,
  },
  chipActive: {
    backgroundColor: theme.colors.strongPrimary,
    borderColor: theme.colors.strongPrimary,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  chipTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#212529' },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearLink: { fontSize: 13, fontWeight: '600', color: theme.colors.accent },
  emptyText: { fontSize: 14, color: theme.colors.textPlaceholder, fontStyle: 'italic' },
  libraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  librarySentence: { flex: 1, fontSize: 14, color: '#495057', marginRight: 10 },
  removeBtn: { fontSize: 15, color: theme.colors.textPlaceholder, fontWeight: '700' },
  input: {
    backgroundColor: '#f1f3f5',
    borderRadius: theme.radius.small,
    padding: 12,
    fontSize: 15,
    color: '#212529',
    marginBottom: 16,
    minHeight: 44,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.lightBorder,
  },
  buttonRow: { flexDirection: 'row', gap: theme.spacing.small },
  statsText: {
    fontSize: 13,
    color: theme.colors.textPlaceholder,
    marginTop: 12,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: theme.colors.errorBackground,
    padding: 12,
    borderRadius: theme.radius.small,
    marginBottom: 20,
  },
  errorText: { color: theme.colors.errorText, fontSize: 14, textAlign: 'center' },
  queryText: { fontSize: 13, color: theme.colors.textMuted, marginTop: 2, marginBottom: 14 },
  matchRow: { marginBottom: 14 },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  matchSentence: { flex: 1, fontSize: 14, color: '#495057', marginRight: 10 },
  matchTop: { fontWeight: '700', color: theme.colors.strongPrimary },
  matchScore: { fontSize: 13, fontWeight: '700', color: theme.colors.textMuted },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f1f3f5',
    overflow: 'hidden',
  },
  barFill: { height: 8, borderRadius: 4, backgroundColor: '#adb5bd' },
  barFillTop: { backgroundColor: theme.colors.accent },
});
