import React, { useMemo, useState } from 'react';
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
  usePrivacyFilter,
  models,
  piiSegments,
  type PiiEntity,
  type PiiSegment,
  type PrivacyFilterModel,
} from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ModelStatus } from '../../components/ModelStatus';
import { Button } from '../../components/Button';
import { theme } from '../../theme';

/* cspell:disable */
const OPENAI_SAMPLE = `My name is Sarah Chen and I work as a senior engineer at Acme Corp. You can reach me at sarah.chen@acmecorp.io or call my direct line at (415) 923-0847. For billing inquiries, my account number is ACC-8821-4490-3371.

I've been living at 17 Birchwood Lane, Portland, OR 97201 since October 3rd, 2019. My personal website is https://sarahchen.dev. My date of birth is June 12, 1991, and this message contains a confidential API key: sk-T93kXpLm2NvBqR7dYwZ4.`;

const NEMOTRON_SAMPLE = `Patient intake for Maria Lopez, female, age 47, blood type O+, born 1978-05-12. MRN 994-2210-AB; health plan beneficiary number HPBN-552-9931. SSN 412-55-7821. Occupation: registered nurse.

Reach her at maria.lopez@example.com or +1 (415) 555-0142. Address: 84 Cedar Hill Road, Berkeley, CA 94703. Visa ending 4992-1133-7820-4419, CVV 884. Bank routing 021000089. Workstation MAC 3C:22:FB:8E:01:9A, IPv4 10.0.42.118.`;
/* cspell:enable */

const MODELS: { label: string; value: PrivacyFilterModel; sample: string; iosOnly?: boolean }[] = [
  { label: 'OpenAI (8 types)', value: models.privacyFilter.OPENAI.DEFAULT, sample: OPENAI_SAMPLE },
  {
    label: 'OpenAI MLX',
    value: models.privacyFilter.OPENAI.MLX_INT4,
    sample: OPENAI_SAMPLE,
    iosOnly: true,
  },
  {
    label: 'Nemotron (55 types)',
    value: models.privacyFilter.NEMOTRON.DEFAULT,
    sample: NEMOTRON_SAMPLE,
  },
  {
    label: 'Nemotron MLX',
    value: models.privacyFilter.NEMOTRON.MLX_INT8,
    sample: NEMOTRON_SAMPLE,
    iosOnly: true,
  },
];

const HIGHLIGHTS = ['#ffd8a8', '#b2f2bb', '#a5d8ff', '#eebefa', '#ffc9c9', '#c0eb75', '#99e9f2'];
function colorForLabel(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) % HIGHLIGHTS.length;
  }
  return HIGHLIGHTS[hash]!;
}

function PrivacyFilterContent() {
  const [selected, setSelected] = useState(0);
  const active = MODELS[selected]!;
  const { isReady, downloadProgress, error, detectPii } = usePrivacyFilter(active.value);

  const [text, setText] = useState(active.sample);
  const [entities, setEntities] = useState<PiiEntity[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [inferenceMs, setInferenceMs] = useState<number | null>(null);

  const ready = isReady && !!detectPii;
  const segments: PiiSegment[] | null = useMemo(
    () => (entities ? piiSegments(text, entities) : null),
    [text, entities]
  );

  const selectModel = (i: number) => {
    if (i === selected) return;
    setSelected(i);
    setText(MODELS[i]!.sample);
    setEntities(null);
    setRunError(null);
    setInferenceMs(null);
  };

  const run = async () => {
    if (!detectPii || !text.trim()) return;
    setBusy(true);
    setRunError(null);
    setEntities(null);
    try {
      const startedAt = Date.now();
      const found = await detectPii(text);
      setInferenceMs(Date.now() - startedAt);
      setEntities(found);
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
          <Text style={styles.cardTitle}>Privacy Filter</Text>
          <Text style={styles.cardDescription}>
            On-device PII detection. The model labels every token, a constrained Viterbi decode
            turns those labels into BIOES-valid spans, and long inputs are processed in overlapping
            windows.
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
          <Text style={styles.sectionTitle}>Text to scan</Text>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={(t) => {
              setText(t);
              setEntities(null);
            }}
            autoCapitalize="none"
            placeholder="Paste text containing personal data…"
            placeholderTextColor="#999"
            multiline
          />
          <View style={styles.buttonRow}>
            <Button
              title="Detect PII"
              onPress={run}
              disabled={!ready || !text.trim()}
              loading={busy}
            />
            <Button
              title="Reset sample"
              variant="secondary"
              onPress={() => {
                setText(active.sample);
                setEntities(null);
              }}
            />
          </View>
          {inferenceMs !== null && (
            <Text style={styles.statsText}>Inference time: {inferenceMs} ms</Text>
          )}
        </View>

        {segments && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Highlighted</Text>
            <Text style={styles.sampleText}>
              {segments.map((seg, i) =>
                seg.kind === 'entity' ? (
                  <Text
                    key={i}
                    style={[styles.highlight, { backgroundColor: colorForLabel(seg.label) }]}
                  >
                    {seg.text}
                  </Text>
                ) : (
                  <Text key={i}>{seg.text}</Text>
                )
              )}
            </Text>
          </View>
        )}

        {entities && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Detected entities ({entities.length})</Text>
            {entities.length === 0 ? (
              <Text style={styles.emptyText}>No PII detected in this text.</Text>
            ) : (
              entities.map((e, i) => (
                <View key={`${e.startToken}-${i}`} style={styles.entityRow}>
                  <View style={[styles.badge, { backgroundColor: colorForLabel(e.label) }]}>
                    <Text style={styles.badgeText}>{e.label}</Text>
                  </View>
                  <Text style={styles.entityText} numberOfLines={2}>
                    {e.text}
                  </Text>
                  <Text style={styles.entityTokens}>
                    {e.startToken}–{e.endToken}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function PrivacyFilterScreen() {
  return (
    <ScreenWrapper>
      <PrivacyFilterContent />
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
  sampleText: { fontSize: 14, lineHeight: 22, color: '#495057' },
  highlight: { borderRadius: 3 },
  emptyText: { fontSize: 14, color: theme.colors.textPlaceholder, fontStyle: 'italic' },
  entityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 10 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#212529' },
  entityText: { flex: 1, fontSize: 14, color: '#495057', marginRight: 8 },
  entityTokens: { fontSize: 11, color: theme.colors.textPlaceholder },
});
