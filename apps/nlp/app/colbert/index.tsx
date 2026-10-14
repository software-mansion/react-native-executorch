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
import {
  maxSim,
  models,
  useColbertEmbedder,
  type ColbertEmbedderModel,
  type TokenEmbeddings,
} from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ModelStatus } from '../../components/ModelStatus';
import { Button } from '../../components/Button';
import { theme } from '../../theme';

// `iosOnly` marks backends unavailable on Android (MLX is iOS-only).
const MODELS: { label: string; value: ColbertEmbedderModel; iosOnly?: boolean }[] = [
  { label: 'LFM2.5 XNNPACK', value: models.colbertEmbeddings.LFM2_5_COLBERT_350M.XNNPACK_8DA4W },
  {
    label: 'LFM2.5 MLX',
    value: models.colbertEmbeddings.LFM2_5_COLBERT_350M.MLX_INT4,
    iosOnly: true,
  },
];

const STARTER_DOCUMENTS = [
  'To change your login credentials, open Settings, tap Security and choose a new password.',
  'Canberra was selected as the Australian capital in 1908 as a compromise between Sydney and Melbourne.',
  'Grapes and raisins are toxic to dogs and can cause sudden kidney failure.',
  'The Eiffel Tower is about 330 metres tall, including its antennas.',
  'Keep basil stems in a glass of water at room temperature, loosely covered with a plastic bag.',
];

type Entry = { text: string; embedding: TokenEmbeddings };
type Match = { text: string; score: number };

const isDisposedError = (msg: string) => /disposed/i.test(msg);

function ColbertContent() {
  const [selected, setSelected] = useState(0);
  const { isReady, downloadProgress, error, embed } = useColbertEmbedder(MODELS[selected]!.value);

  const [library, setLibrary] = useState<Entry[]>([]);
  const [input, setInput] = useState('');
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [queryText, setQueryText] = useState('');
  const [busy, setBusy] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [stats, setStats] = useState<string | null>(null);

  const ready = isReady && !!embed;

  // Re-index the starter documents whenever the model changes.
  useEffect(() => {
    if (!ready || !embed) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      setRunError(null);
      try {
        const entries: Entry[] = [];
        for (const text of STARTER_DOCUMENTS) {
          const embedding = await embed(text, 'document');
          if (cancelled) return;
          entries.push({ text, embedding });
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
  }, [embed, ready]);

  const selectModel = (i: number) => {
    if (i === selected) return;
    setSelected(i);
    setLibrary([]);
    setMatches(null);
    setQueryText('');
    setStats(null);
  };

  const search = async () => {
    if (!embed || !input.trim() || library.length === 0) return;
    setBusy(true);
    setRunError(null);
    try {
      const start = Date.now();
      const query = await embed(input.trim(), 'query');
      const embedMs = Date.now() - start;
      const ranked = library
        .map(({ text, embedding }) => ({ text, score: maxSim(query, embedding) }))
        .sort((a, b) => b.score - a.score);
      setStats(`Query: ${query.numTokens} vectors in ${embedMs} ms`);
      setQueryText(input.trim());
      setMatches(ranked);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      if (!isDisposedError(msg)) setRunError(msg);
    } finally {
      setBusy(false);
    }
  };

  const addDocument = async () => {
    if (!embed || !input.trim()) return;
    setBusy(true);
    setRunError(null);
    try {
      const text = input.trim();
      const start = Date.now();
      const embedding = await embed(text, 'document');
      setStats(`Document: ${embedding.numTokens} vectors in ${Date.now() - start} ms`);
      setLibrary((prev) => [...prev, { text, embedding }]);
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

  // MaxSim is a sum over query vectors, not a [0, 1] similarity, so bars are
  // drawn relative to the top match.
  const best = matches?.[0]?.score ?? 1;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ColBERT Retrieval</Text>
          <Text style={styles.cardDescription}>
            Late-interaction search. Every document and query is embedded as one vector per token,
            and documents are ranked by MaxSim: the best-matching document token for each query
            token, summed.
          </Text>

          <Text style={styles.fieldLabel}>Model</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {MODELS.map((m, i) => {
              const disabled = m.iosOnly && Platform.OS !== 'ios';
              return (
                <TouchableOpacity
                  key={m.label}
                  style={[
                    styles.chip,
                    i === selected && styles.chipActive,
                    disabled && styles.chipDisabled,
                  ]}
                  onPress={() => selectModel(i)}
                  disabled={disabled}
                >
                  <Text style={[styles.chipText, i === selected && styles.chipTextActive]}>
                    {m.label}
                    {disabled ? ' (iOS)' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
          <Text style={styles.sectionTitle}>Documents ({library.length})</Text>
          {library.length === 0 ? (
            <Text style={styles.emptyText}>
              {ready ? 'No documents — add one below.' : 'Waiting for the model…'}
            </Text>
          ) : (
            library.map((item, i) => (
              <View key={`${item.text}-${i}`} style={styles.libraryRow}>
                <Text style={styles.librarySentence}>{item.text}</Text>
                <TouchableOpacity onPress={() => removeAt(i)} hitSlop={8}>
                  <Text style={styles.removeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Search</Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            autoCapitalize="none"
            placeholder="Ask a question, in any of 11 languages…"
            placeholderTextColor="#999"
            multiline
          />
          <View style={styles.buttonRow}>
            <Button
              title="Search"
              onPress={search}
              disabled={!ready || !input.trim() || library.length === 0}
              loading={busy}
            />
            <Button
              title="Add document"
              variant="secondary"
              onPress={addDocument}
              disabled={!ready || !input.trim()}
            />
          </View>
          {stats !== null && <Text style={styles.statsText}>{stats}</Text>}
        </View>

        {matches && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ranked by MaxSim</Text>
            <Text style={styles.queryText}>for “{queryText}”</Text>
            {matches.map((m, i) => {
              const pct = Math.max(0, Math.min(1, m.score / best)) * 100;
              return (
                <View key={`${m.text}-${i}`} style={styles.matchRow}>
                  <View style={styles.matchHeader}>
                    <Text style={[styles.matchSentence, i === 0 && styles.matchTop]}>{m.text}</Text>
                    <Text style={styles.matchScore}>{m.score.toFixed(2)}</Text>
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

export default function ColbertScreen() {
  return (
    <ScreenWrapper>
      <ColbertContent />
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
  chipDisabled: { opacity: 0.4 },
  chipText: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  chipTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#212529', marginBottom: 12 },
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
  queryText: { fontSize: 13, color: theme.colors.textMuted, marginTop: -8, marginBottom: 14 },
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
