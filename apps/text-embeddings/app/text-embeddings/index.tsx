import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModelPicker } from '../../components/ModelPicker';
import {
  models,
  useTextEmbeddings,
  TextEmbeddingsProps,
  EmbeddingResult,
  dotProduct,
  maxSim,
} from 'react-native-executorch';
import { useIsFocused } from 'expo-router';
import ErrorBanner from '../../components/ErrorBanner';
import { SafeAreaView } from 'react-native-safe-area-context';

const textEmbedding = models.text_embedding;

type TextEmbeddingModel = TextEmbeddingsProps['model'];
type Encoding = Float32Array | EmbeddingResult;

const MODELS: { label: string; value: TextEmbeddingModel }[] = [
  { label: 'MiniLM L6', value: textEmbedding.all_minilm_l6_v2() },
  {
    label: 'MPNet Base',
    value: textEmbedding.all_mpnet_base_v2(),
  },
  {
    label: 'MultiQA MiniLM',
    value: textEmbedding.multi_qa_minilm_l6_cos_v1(),
  },
  {
    label: 'MultiQA MPNet',
    value: textEmbedding.multi_qa_mpnet_base_dot_v1(),
  },
  {
    label: 'Multilingual DistilUSE',
    value: textEmbedding.distiluse_base_multilingual_cased_v2(),
  },
  {
    label: 'Multilingual Paraphrase',
    value: textEmbedding.paraphrase_multilingual_minilm_l12_v2(),
  },
  {
    label: 'LFM2.5 Embedding',
    value: textEmbedding.lfm2_5_embedding_350m(),
  },
  {
    label: 'LFM2.5 ColBERT (late-interaction)',
    value: textEmbedding.lfm2_5_colbert_350m(),
  },
];

const CORPUS: string[] = [
  'The forecast says heavy showers this afternoon.',
  "It's so sunny outside today!",
  'A thick fog rolled in over the harbor at dawn.',
  'The home team scored in the final minute to win the match.',
  'She sprinted the last lap and broke the national record.',
  'Fans packed the stadium for the championship game.',
  'Simmer the tomatoes with garlic before adding the pasta.',
  'He whisked the eggs and folded in the melted chocolate.',
  'The new phone has a faster chip and a brighter screen.',
  'Our servers crashed under the sudden spike in traffic.',
  'The flight to Tokyo was delayed by three hours.',
  'We hiked along the coast and camped near the cliffs.',
];

const EXAMPLE_QUERIES: string[] = [
  "What's the weather like?",
  'Who won the match?',
  'Tell me about the latest technology',
  'How do I cook dinner?',
  'Where did they travel?',
];

export default function TextEmbeddingsScreenWrapper() {
  const isFocused = useIsFocused();

  return isFocused ? <TextEmbeddingsScreen /> : null;
}

type RankedResult = { sentence: string; similarity: number };

function TextEmbeddingsScreen() {
  const [selectedModel, setSelectedModel] = useState<TextEmbeddingModel>(
    textEmbedding.all_minilm_l6_v2()
  );
  const model = useTextEmbeddings({ model: selectedModel });
  const [error, setError] = useState<string | null>(null);

  const isMultiVector = !!selectedModel.multiVector;
  const skipListIds = selectedModel.skipListIds ?? [];

  const [query, setQuery] = useState('');
  const [corpusEmbeddings, setCorpusEmbeddings] = useState<
    { sentence: string; embedding: Encoding }[]
  >([]);
  const [results, setResults] = useState<RankedResult[]>([]);
  const [embeddingTime, setEmbeddingTime] = useState<number | null>(null);
  const [indexing, setIndexing] = useState(false);

  useEffect(
    () => {
      let cancelled = false;
      const indexCorpus = async () => {
        if (!model.isReady) return;
        setIndexing(true);
        setResults([]);
        try {
          const embedded = [];
          for (const sentence of CORPUS) {
            const embedding = await model.forward(sentence, 'document');
            if (cancelled) return;
            embedded.push({ sentence, embedding });
          }
          setCorpusEmbeddings(embedded);
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
    [model.isReady, selectedModel]
  );

  const runSearch = async (queryText: string = query) => {
    const q = queryText.trim();
    if (!model.isReady || !q || corpusEmbeddings.length === 0) return;
    setQuery(queryText);
    try {
      const start = Date.now();
      const queryEmbedding = (await model.forward(q, 'query')) as Encoding;
      setEmbeddingTime(Date.now() - start);
      const ranked = corpusEmbeddings
        .map(({ sentence, embedding }) => ({
          sentence,
          similarity: isMultiVector
            ? maxSim(
                queryEmbedding as EmbeddingResult,
                embedding as EmbeddingResult,
                skipListIds
              )
            : dotProduct(
                queryEmbedding as Float32Array,
                embedding as Float32Array
              ),
        }))
        .sort((a, b) => b.similarity - a.similarity);
      setResults(ranked);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const getModelStatusText = () => {
    if (model.error) {
      return `Oops! Error: ${model.error}`;
    }
    if (!model.isReady) {
      return `Loading model ${(model.downloadProgress * 100).toFixed(2)}%`;
    }
    return model.isGenerating ? 'Generating...' : 'Model is ready';
  };

  const ready = model.isReady && !indexing && corpusEmbeddings.length > 0;
  const canSearch = ready && !!query.trim();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.heading}>Semantic Search</Text>
          <Text style={styles.sectionTitle}>{getModelStatusText()}</Text>
          <ModelPicker
            models={MODELS}
            selectedModel={selectedModel}
            onSelect={(m) => {
              setSelectedModel(m);
              setCorpusEmbeddings([]);
              setResults([]);
              setQuery('');
            }}
          />
          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Search the corpus ({CORPUS.length} sentences)
            </Text>
            <Text style={styles.hint}>
              {isMultiVector
                ? 'Ranks per-token vectors with MaxSim (late interaction). Ask a full question — tap an example or type your own.'
                : 'Ranks every sentence by meaning. Ask a full question — tap an example or type your own.'}
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
              style={[
                styles.buttonPrimary,
                !canSearch && styles.buttonDisabled,
              ]}
              disabled={!canSearch}
            >
              <Ionicons
                name="search"
                size={16}
                color={!canSearch ? 'gray' : 'white'}
              />
              <Text
                style={[
                  styles.buttonText,
                  !canSearch && styles.buttonTextDisabled,
                ]}
              >
                {indexing ? 'Indexing corpus…' : 'Search'}
              </Text>
            </TouchableOpacity>
            {embeddingTime !== null && (
              <Text style={styles.statsText}>
                Query embedded in {embeddingTime} ms
              </Text>
            )}
          </View>

          {results.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Results</Text>
              {results.map((item, index) => (
                <ResultRow
                  key={index}
                  sentence={item.sentence}
                  similarity={item.similarity}
                  best={results[0].similarity}
                  rank={index}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ResultRow({
  sentence,
  similarity,
  best,
  rank,
}: {
  sentence: string;
  similarity: number;
  best: number;
  rank: number;
}) {
  const fraction = best > 0 ? Math.max(0, similarity / best) : 0;
  return (
    <View style={styles.resultRow}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultText}>{sentence}</Text>
        <Text style={styles.resultScore}>{similarity.toFixed(2)}</Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.round(fraction * 100)}%` },
            rank === 0 && styles.barFillTop,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
    flexGrow: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: '500',
    marginBottom: 20,
    color: '#0F172A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderColor: '#E2E8F0',
    borderWidth: 2,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
    color: '#1E293B',
  },
  hint: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    fontSize: 13,
    color: 'navy',
  },
  resultRow: {
    marginBottom: 14,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  resultText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
  },
  resultScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#94A3B8',
  },
  barFillTop: {
    backgroundColor: 'navy',
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    color: '#0F172A',
    minHeight: 40,
    textAlignVertical: 'top',
  },
  buttonPrimary: {
    width: '100%',
    backgroundColor: 'navy',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#d3d3d3',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonTextDisabled: {
    color: 'gray',
  },
  statsText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  flexContainer: {
    flex: 1,
  },
});
