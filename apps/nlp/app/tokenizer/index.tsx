import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useTokenizer, models } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ModelStatus } from '../../components/ModelStatus';
import { Button } from '../../components/Button';
import { theme } from '../../theme';

type Check = { label: string; detail: string; pass: boolean };

function TokenizerContent() {
  const { isReady, downloadProgress, error, encode, decode, getVocabSize, idToToken, tokenToId } =
    useTokenizer(models.tokenizer.ALL_MINILM_L6_V2);

  const [text, setText] = useState('Hello world');
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [ids, setIds] = useState<number[] | null>(null);
  const [roundTrip, setRoundTrip] = useState<string | null>(null);
  const [vocabSize, setVocabSize] = useState<number | null>(null);
  const [checks, setChecks] = useState<Check[]>([]);

  const ready = isReady && encode && decode && getVocabSize && idToToken && tokenToId;

  const run = async () => {
    if (!ready) return;
    setRunning(true);
    setRunError(null);
    setIds(null);
    setRoundTrip(null);
    setVocabSize(null);
    setChecks([]);
    try {
      const tokenIds = await encode(text);
      const decoded = await decode(tokenIds, true);
      const vocab = getVocabSize();

      // Self-consistent inverse check on a token from the actual output
      // (HFTokenizer adds special tokens per the tokenizer.json post_processor).
      const sampleId = tokenIds[Math.min(1, tokenIds.length - 1)]!;
      const sampleToken = idToToken(sampleId);
      const sampleIdBack = tokenToId(sampleToken);

      const nextChecks: Check[] = [
        {
          label: 'Round-trip decode(encode(text))',
          detail: `"${decoded}" vs "${text.toLowerCase()}"`,
          // all-MiniLM-L6-v2 is an uncased BERT WordPiece tokenizer
          pass: decoded.trim() === text.trim().toLowerCase(),
        },
        {
          label: 'Vocabulary size',
          detail: `${vocab} (expected 30522 for bert-base-uncased)`,
          pass: vocab === 30522,
        },
        {
          label: 'Inverse tokenToId(idToToken(id))',
          detail: `${sampleId} → "${sampleToken}" → ${sampleIdBack}`,
          pass: sampleIdBack === sampleId,
        },
      ];

      setIds(tokenIds);
      setRoundTrip(decoded);
      setVocabSize(vocab);
      setChecks(nextChecks);

      // Structured log so the result is verifiable from device/Metro logs.
      console.log(
        '[TokenizerTest]',
        JSON.stringify({
          allPass: nextChecks.every((c) => c.pass),
          input: text,
          ids: tokenIds,
          decoded,
          vocab,
          checks: nextChecks.map((c) => ({ label: c.label, pass: c.pass, detail: c.detail })),
        })
      );
    } catch (e: any) {
      console.log('[TokenizerTest] ERROR', e?.message ?? String(e));
      setRunError(e?.message ?? String(e));
    } finally {
      setRunning(false);
    }
  };

  // Auto-run once as soon as the tokenizer is ready, so the demo doubles as a
  // self-checking smoke test (results logged under "[TokenizerTest]").
  const autoRan = useRef(false);
  useEffect(() => {
    if (ready && !autoRan.current) {
      autoRan.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tokenizer</Text>
        <Text style={styles.cardDescription}>
          Loads the all-MiniLM-L6-v2 tokenizer and proves encode / decode / getVocabSize / idToToken
          / tokenToId work end-to-end against the native HFTokenizer.
        </Text>

        <ModelStatus
          isReady={isReady}
          downloadProgress={downloadProgress}
          error={error ? error.message : null}
          modelTypeLabel="tokenizer"
        />

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Type text to tokenize"
          placeholderTextColor="#999"
        />

        <View style={styles.buttonRow}>
          <Button title="Run tokenizer" onPress={run} disabled={!ready} loading={running} />
        </View>
      </View>

      {runError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{runError}</Text>
        </View>
      )}

      {ids && (
        <View style={styles.resultsCard}>
          <Text style={styles.resultsHeader}>Results</Text>

          <Text style={styles.fieldLabel}>Token IDs ({ids.length})</Text>
          <Text style={styles.mono}>[{ids.join(', ')}]</Text>

          <Text style={styles.fieldLabel}>Decoded (skipSpecialTokens)</Text>
          <Text style={styles.mono}>{roundTrip}</Text>

          <Text style={styles.fieldLabel}>Vocab size</Text>
          <Text style={styles.mono}>{vocabSize}</Text>

          <Text style={styles.checksHeader}>Assertions</Text>
          {checks.map((c, i) => (
            <View key={i} style={styles.checkRow}>
              <Text style={[styles.checkBadge, c.pass ? styles.pass : styles.fail]}>
                {c.pass ? 'PASS' : 'FAIL'}
              </Text>
              <View style={styles.checkBody}>
                <Text style={styles.checkLabel}>{c.label}</Text>
                <Text style={styles.checkDetail}>{c.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export default function TokenizerScreen() {
  return (
    <ScreenWrapper>
      <TokenizerContent />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
  input: {
    backgroundColor: '#f1f3f5',
    borderRadius: theme.radius.small,
    padding: 12,
    fontSize: 15,
    color: '#212529',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.lightBorder,
  },
  buttonRow: { flexDirection: 'row', gap: theme.spacing.small },
  errorContainer: {
    backgroundColor: theme.colors.errorBackground,
    padding: 12,
    borderRadius: theme.radius.small,
    marginBottom: 16,
  },
  errorText: { color: theme.colors.errorText, fontSize: 14, textAlign: 'center' },
  resultsCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.large,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.lightBorder,
  },
  resultsHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPlaceholder,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
  },
  mono: {
    fontSize: 13,
    color: '#495057',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.lightBorder,
  },
  checksHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginTop: 20,
    marginBottom: 10,
  },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  checkBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  pass: { backgroundColor: '#2b8a3e' },
  fail: { backgroundColor: theme.colors.errorText },
  checkBody: { flex: 1 },
  checkLabel: { fontSize: 14, fontWeight: '600', color: '#212529' },
  checkDetail: { fontSize: 12, color: theme.colors.textPlaceholder, marginTop: 2 },
});
