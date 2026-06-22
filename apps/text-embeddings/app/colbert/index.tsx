import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from 'expo-router';
import {
  models,
  useTextEmbeddings,
  EmbeddingResult,
} from 'react-native-executorch';
import ColorPalette from '../../colors';
import ErrorBanner from '../../components/ErrorBanner';
import { maxSim } from '../../utils/math';

const colbertModel = models.text_embedding.lfm2_5_colbert_350m();

// The library auto-applies the model's [Q]/[D] prompts via forward(text, role)
// and ships the document skiplist on the model config; we just pass it to the
// shipped MaxSim util.
const SKIPLIST = colbertModel.skiplistIds ?? [];

const CORPUS: string[] = [
  'The forecast says heavy showers this afternoon.',
  "It's so sunny outside today!",
  'The home team scored in the final minute to win the match.',
  'Fans packed the stadium for the championship game.',
  'Simmer the tomatoes with garlic before adding the pasta.',
  'He whisked the eggs and folded in the melted chocolate.',
  'The new phone has a faster chip and a brighter screen.',
  'The flight to Tokyo was delayed by three hours.',
  'We hiked along the coast and camped near the cliffs.',
];

const EXAMPLE_QUERIES: string[] = [
  "What's the weather like?",
  'Who won the match?',
  'How do I cook dinner?',
  'Tell me about the latest technology',
];

type Ranked = { sentence: string; score: number };

export default function ColbertScreenWrapper() {
  return useIsFocused() ? <ColbertScreen /> : null;
}

function ColbertScreen() {
  const model = useTextEmbeddings({ model: colbertModel });
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [docEncs, setDocEncs] = useState<
    { sentence: string; enc: EmbeddingResult }[]
  >([]);
  const [results, setResults] = useState<Ranked[]>([]);
  const [indexing, setIndexing] = useState(false);
  const [encodeTime, setEncodeTime] = useState<number | null>(null);

  useEffect(
    () => {
      let cancelled = false;
      const indexCorpus = async () => {
        if (!model.isReady) return;
        setIndexing(true);
        setResults([]);
        try {
          const encs = [];
          for (const sentence of CORPUS) {
            const enc = await model.forward(sentence, 'document');
            if (cancelled) return;
            encs.push({ sentence, enc });
          }
          setDocEncs(encs);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        } finally {
          if (!cancelled) setIndexing(false);
        }
      };
      indexCorpus();
      return () => {
        cancelled = true;
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model.isReady]
  );

  const runSearch = async (queryText: string = query) => {
    const q = queryText.trim();
    if (!model.isReady || !q || docEncs.length === 0) return;
    setQuery(queryText);
    try {
      const start = Date.now();
      const qEnc = await model.forward(q, 'query');
      setEncodeTime(Date.now() - start);
      const ranked = docEncs
        .map(({ sentence, enc }) => ({
          sentence,
          score: maxSim(qEnc, enc, SKIPLIST),
        }))
        .sort((a, b) => b.score - a.score);
      setResults(ranked);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const ready = model.isReady && !indexing && docEncs.length > 0;
  const canSearch = ready && !!query.trim();

  const statusText = model.error
    ? `Error: ${model.error}`
    : !model.isReady
      ? `Loading model ${(model.downloadProgress * 100).toFixed(0)}%`
      : indexing
        ? 'Indexing corpus…'
        : 'Ready';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.heading}>ColBERT Late-Interaction Search</Text>
          <Text style={styles.status}>{statusText}</Text>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Search the corpus ({CORPUS.length} sentences)
            </Text>
            <Text style={styles.hint}>
              Per-token vectors scored with MaxSim. Tap an example or type a
              query.
            </Text>
            <View style={styles.chipRow}>
              {EXAMPLE_QUERIES.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.chip, !ready && styles.chipDisabled]}
                  disabled={!ready}
                  onPress={() => runSearch(q)}
                >
                  <Text style={styles.chipText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              placeholder="Type a search query..."
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => runSearch()}
              returnKeyType="search"
            />
            <TouchableOpacity
              onPress={() => runSearch()}
              style={[styles.button, !canSearch && styles.buttonDisabled]}
              disabled={!canSearch}
            >
              <Ionicons
                name="search"
                size={16}
                color={!canSearch ? 'gray' : 'white'}
              />
              <Text style={[styles.buttonText, !canSearch && styles.buttonTextDisabled]}>
                {indexing ? 'Indexing…' : 'Search'}
              </Text>
            </TouchableOpacity>
            {encodeTime !== null && (
              <Text style={styles.stats}>Query encoded in {encodeTime} ms</Text>
            )}
          </View>

          {results.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Results</Text>
              {results.map((r, i) => (
                <View key={i} style={styles.resultRow}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultText}>{r.sentence}</Text>
                    <Text style={styles.resultScore}>{r.score.toFixed(2)}</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.round(
                            (results[0].score > 0 ? r.score / results[0].score : 0) * 100
                          )}%`,
                        },
                        i === 0 && styles.barFillTop,
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  flex: { flex: 1 },
  scroll: { padding: 20 },
  heading: { fontSize: 22, fontWeight: '500', marginBottom: 8, color: '#0F172A' },
  status: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderColor: '#E2E8F0',
    borderWidth: 2,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#1E293B' },
  hint: { fontSize: 13, color: '#64748B', marginBottom: 12, lineHeight: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipDisabled: { opacity: 0.4 },
  chipText: { fontSize: 13, color: 'navy' },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    color: '#0F172A',
    minHeight: 40,
  },
  button: {
    backgroundColor: 'navy',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: '#f0f0f0' },
  buttonText: { color: '#fff', fontWeight: '500', marginLeft: 6 },
  buttonTextDisabled: { color: 'gray' },
  stats: { fontSize: 13, color: '#64748B', marginTop: 8, textAlign: 'center' },
  resultRow: { marginBottom: 14 },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  resultText: { flex: 1, fontSize: 14, color: '#334155' },
  resultScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: '#94A3B8' },
  barFillTop: { backgroundColor: 'navy' },
});
