import React, { useState } from 'react';
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
import { useTranslator, models, type MarianTranslatorModel } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ModelStatus } from '../../components/ModelStatus';
import { Button } from '../../components/Button';
import { theme } from '../../theme';

/* cspell:disable */
const SAMPLES = {
  en: 'The weather is beautiful today. Shall we go for a walk in the park?\nI will bring something to drink.',
  de: 'Das Wetter ist heute wunderschön. Sollen wir im Park spazieren gehen?\nIch bringe etwas zu trinken mit.',
  es: 'Hoy hace un tiempo precioso. ¿Vamos a dar un paseo por el parque?\nYo llevaré algo de beber.',
  fr: 'Il fait très beau aujourd’hui. On va se promener dans le parc ?\nJ’apporterai quelque chose à boire.',
} as const;
/* cspell:enable */

const PAIRS: { label: string; value: MarianTranslatorModel }[] = [
  { label: 'EN → DE', value: models.translation.OPUS_MT_EN_DE.DEFAULT },
  { label: 'DE → EN', value: models.translation.OPUS_MT_DE_EN.DEFAULT },
  { label: 'EN → ES', value: models.translation.OPUS_MT_EN_ES.DEFAULT },
  { label: 'ES → EN', value: models.translation.OPUS_MT_ES_EN.DEFAULT },
  { label: 'EN → FR', value: models.translation.OPUS_MT_EN_FR.DEFAULT },
  { label: 'FR → EN', value: models.translation.OPUS_MT_FR_EN.DEFAULT },
];

const sampleFor = (model: MarianTranslatorModel): string =>
  SAMPLES[model.sourceLanguage as keyof typeof SAMPLES] ?? '';

function TranslationContent() {
  const [selected, setSelected] = useState(0);
  const active = PAIRS[selected]!;
  const { isReady, downloadProgress, error, translate, translateStop } = useTranslator(
    active.value
  );

  const [text, setText] = useState(sampleFor(active.value));
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const selectPair = (i: number) => {
    if (i === selected) return;
    translateStop?.();
    setSelected(i);
    setText(sampleFor(PAIRS[i]!.value));
    setOutput('');
    setRunError(null);
    setElapsedMs(null);
  };

  const run = async () => {
    if (!translate || !text.trim()) return;
    setBusy(true);
    setRunError(null);
    setOutput('');
    setElapsedMs(null);
    try {
      const startedAt = Date.now();
      const result = await translate(text, (piece) => setOutput((prev) => prev + piece));
      setElapsedMs(Date.now() - startedAt);
      setOutput(result);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      if (!/disposed/i.test(msg)) setRunError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Translation</Text>
          <Text style={styles.cardDescription}>
            On-device Opus-MT translation. Each model covers one language pair and translates the
            text a sentence at a time, streaming the result as it is decoded.
          </Text>

          <Text style={styles.fieldLabel}>Language pair</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {PAIRS.map((pair, i) => (
              <TouchableOpacity
                key={pair.label}
                style={[styles.chip, i === selected && styles.chipActive]}
                onPress={() => selectPair(i)}
              >
                <Text style={[styles.chipText, i === selected && styles.chipTextActive]}>
                  {pair.label}
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
          <Text style={styles.sectionTitle}>Text to translate</Text>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type or paste text…"
            placeholderTextColor="#999"
            multiline
          />
          <View style={styles.buttonRow}>
            <Button
              title="Translate"
              onPress={run}
              disabled={!isReady || !translate || !text.trim()}
              loading={busy}
            />
            <Button
              title="Stop"
              variant="secondary"
              onPress={() => translateStop?.()}
              disabled={!busy}
            />
          </View>
          {elapsedMs !== null && <Text style={styles.statsText}>Time: {elapsedMs} ms</Text>}
        </View>

        {output !== '' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Translation</Text>
            <Text style={styles.outputText}>{output}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function TranslationScreen() {
  return (
    <ScreenWrapper>
      <TranslationContent />
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#212529', marginBottom: 12 },
  input: {
    backgroundColor: '#f1f3f5',
    borderRadius: theme.radius.small,
    padding: 12,
    fontSize: 14,
    color: '#212529',
    marginBottom: 16,
    minHeight: 140,
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
  outputText: { fontSize: 15, lineHeight: 22, color: '#212529' },
});
