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
import {
  useTranslator,
  models,
  type TranslationLanguages,
  type TranslatorModel,
} from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ModelStatus } from '../../components/ModelStatus';
import { Button } from '../../components/Button';
import { theme } from '../../theme';

/* cspell:disable */
const SAMPLES: Record<string, string> = {
  en: 'The weather is beautiful today. Shall we go for a walk in the park?\nI will bring something to drink.',
  de: 'Das Wetter ist heute wunderschön. Sollen wir im Park spazieren gehen?\nIch bringe etwas zu trinken mit.',
  es: 'Hoy hace un tiempo precioso. ¿Vamos a dar un paseo por el parque?\nYo llevaré algo de beber.',
  fr: 'Il fait très beau aujourd’hui. On va se promener dans le parc ?\nJ’apporterai quelque chose à boire.',
  pl: 'Dzisiaj jest piękna pogoda. Może pójdziemy na spacer do parku?\nPrzyniosę coś do picia.',
};
/* cspell:enable */

type Pair = { label: string; languages: TranslationLanguages };
const pair = (sourceLanguage: string, targetLanguage: string): Pair => ({
  label: `${sourceLanguage.toUpperCase()} → ${targetLanguage.toUpperCase()}`,
  languages: { sourceLanguage, targetLanguage },
});

// Opus-MT ships one model per pair; EuroLLM translates every pair with one.
const OPUS_MT: { pair: Pair; model: TranslatorModel }[] = [
  { pair: pair('en', 'de'), model: models.translation.OPUS_MT_EN_DE.DEFAULT },
  { pair: pair('de', 'en'), model: models.translation.OPUS_MT_DE_EN.DEFAULT },
  { pair: pair('en', 'es'), model: models.translation.OPUS_MT_EN_ES.DEFAULT },
  { pair: pair('es', 'en'), model: models.translation.OPUS_MT_ES_EN.DEFAULT },
  { pair: pair('en', 'fr'), model: models.translation.OPUS_MT_EN_FR.DEFAULT },
  { pair: pair('fr', 'en'), model: models.translation.OPUS_MT_FR_EN.DEFAULT },
];
const EUROLLM_PAIRS = [...OPUS_MT.map((m) => m.pair), pair('en', 'pl'), pair('pl', 'en')];

const FAMILIES = [
  {
    label: 'Opus-MT',
    description:
      'One small model per language pair. Translates a sentence at a time and streams the result as it is decoded.',
    pairs: OPUS_MT.map((m) => m.pair),
    modelFor: (i: number) => OPUS_MT[i]!.model,
  },
  {
    label: 'EuroLLM',
    description:
      'One 1.7 GB model for 35 languages, so switching the pair does not reload it. Translates a line at a time.',
    pairs: EUROLLM_PAIRS,
    modelFor: () => models.translation.EUROLLM_1_7B.DEFAULT as TranslatorModel,
  },
];

function TranslationContent() {
  const [family, setFamily] = useState(0);
  const [selected, setSelected] = useState(0);
  const { pairs, modelFor, description } = FAMILIES[family]!;
  const active = pairs[selected]!;
  const { isReady, downloadProgress, error, translate, translateStop } = useTranslator(
    modelFor(selected)
  );

  const [text, setText] = useState(SAMPLES[active.languages.sourceLanguage] ?? '');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const select = (nextFamily: number, nextPair: number) => {
    if (nextFamily === family && nextPair === selected) return;
    translateStop?.();
    setFamily(nextFamily);
    setSelected(nextPair);
    const source = FAMILIES[nextFamily]!.pairs[nextPair]!.languages.sourceLanguage;
    setText(SAMPLES[source] ?? '');
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
      const result = await translate(text, active.languages, (piece) =>
        setOutput((prev) => prev + piece)
      );
      setElapsedMs(Date.now() - startedAt);
      setOutput(result);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      if (!/disposed/i.test(msg)) setRunError(msg);
    } finally {
      setBusy(false);
    }
  };

  const chips = (labels: string[], current: number, onPress: (i: number) => void) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {labels.map((label, i) => (
        <TouchableOpacity
          key={label}
          style={[styles.chip, i === current && styles.chipActive]}
          onPress={() => onPress(i)}
        >
          <Text style={[styles.chipText, i === current && styles.chipTextActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Translation</Text>
          <Text style={styles.cardDescription}>{description}</Text>

          <Text style={styles.fieldLabel}>Model</Text>
          {chips(
            FAMILIES.map((f) => f.label),
            family,
            (i) => select(i, 0)
          )}

          <Text style={styles.fieldLabel}>Language pair</Text>
          {chips(
            pairs.map((p) => p.label),
            selected,
            (i) => select(family, i)
          )}

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
