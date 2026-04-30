import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PiiEntity,
  PRIVACY_FILTER_NEMOTRON,
  PRIVACY_FILTER_OPENAI,
  PrivacyFilterModelSources,
  usePrivacyFilter,
} from 'react-native-executorch';
import ColorPalette from '../../colors';
import { ModelOption, ModelPicker } from '../../components/ModelPicker';
import {
  buildSegments,
  colorForLabel,
  matchEntities,
} from '../../utils/piiMatching';

/* cspell:disable */
// Sample tuned for the OpenAI base model — exercises the 8 entity types it
// recognizes (person, email, phone, account_number, address, date, url,
// secret).
const OPENAI_SAMPLE = `My name is Sarah Chen and I work as a senior engineer at Acme Corp. You can reach me at sarah.chen@acmecorp.io or call my direct line at (415) 923-0847. For billing inquiries, my account number is ACC-8821-4490-3371.

I've been living at 17 Birchwood Lane, Portland, OR 97201 since October 3rd, 2019. Before that I was at 8 Rue de Rivoli, Paris, 75001, France. My personal website is https://sarahchen.dev and my GitHub is https://github.com/schen-eng. Feel free to connect — I usually respond within a business day.

My date of birth is June 12, 1991, and my backup email is s.chen.personal@gmail.com in case the primary address is unreachable. This message also contains a confidential API key: sk-T93kXpLm2NvBqR7dYwZ4. Please do not share it outside the team. You can also reach my colleague James Okonkwo at j.okonkwo@acmecorp.io or at his mobile +44 7911 123456.`;
// Sample tuned for the OpenMed Nemotron model — covers categories the base
// OpenAI model doesn't have (medical, financial, technical, demographic).

const NEMOTRON_SAMPLE = `Patient intake for Maria Lopez, female, age 47, blood type O+, born 1978-05-12. MRN 994-2210-AB; health plan beneficiary number HPBN-552-9931 with Aetna. SSN 412-55-7821, national ID DNI 88-7762-X. Primary occupation: registered nurse, currently employed full-time at Mercy General. Religion: Catholic; political view: independent.

Reach her at maria.lopez@example.com or +1 (415) 555-0142. Mailing address: 84 Cedar Hill Road, Apt 3B, Berkeley, CA 94703, United States. Vehicle plate 7XKL922; driver license CA-D1294883.

Payment for last visit: Visa ending 4992-1133-7820-4419, expires 11/28, CVV 884. Bank routing 021000089, SWIFT BIC CHASUS33. Employer EIN tax ID 47-3320118. Customer ID CUST-553201, employee ID EMP-A0093.

Workstation MAC 3C:22:FB:8E:01:9A, IPv4 10.0.42.118, device IMEI 359888061234560. Service account API key sk-live-Tn8x3pLm2NvBqR7dYwZ4QF, password Hunter2!Spring. Session cookie sid=eyJ1c2VyIjoiOTk0MjIxMCJ9.`;
/* cspell:enable */

const MODEL_OPTIONS: ModelOption<PrivacyFilterModelSources>[] = [
  { label: 'OpenAI Privacy Filter (8 entities)', value: PRIVACY_FILTER_OPENAI },
  {
    label: 'OpenMed Nemotron (55 entities)',
    value: PRIVACY_FILTER_NEMOTRON,
  },
];

// Pick the right sample to display/run based on the active model.
function sampleFor(model: PrivacyFilterModelSources): string {
  return model.modelName === PRIVACY_FILTER_NEMOTRON.modelName
    ? NEMOTRON_SAMPLE
    : OPENAI_SAMPLE;
}

function HighlightedText({
  source,
  entities,
}: {
  source: string;
  entities: PiiEntity[];
}) {
  const segments = useMemo(
    () => buildSegments(source, matchEntities(source, entities)),
    [source, entities]
  );
  return (
    <Text style={styles.sampleText}>
      {segments.map((seg, i) =>
        seg.label ? (
          <Text
            key={i}
            style={[
              styles.highlight,
              { backgroundColor: colorForLabel(seg.label) },
            ]}
          >
            {seg.text}
          </Text>
        ) : (
          <Text key={i}>{seg.text}</Text>
        )
      )}
    </Text>
  );
}

function PrivacyFilterScreen() {
  const { bottom } = useSafeAreaInsets();
  const [entities, setEntities] = useState<PiiEntity[] | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [inferenceMs, setInferenceMs] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<PrivacyFilterModelSources>(
    PRIVACY_FILTER_OPENAI
  );

  const filter = usePrivacyFilter({ model: selectedModel });
  const sampleText = sampleFor(selectedModel);

  const onRun = async () => {
    setRunError(null);
    setEntities(null);
    setInferenceMs(null);
    const startedAt = Date.now();
    try {
      const result = await filter.generate(sampleText);
      const elapsed = Date.now() - startedAt;
      setInferenceMs(elapsed);
      setEntities(result);
    } catch (e) {
      let msg: string;
      if (e instanceof Error) {
        msg = e.message;
      } else if (e && typeof e === 'object' && 'message' in e) {
        const code =
          'code' in e ? ` (code ${(e as { code: unknown }).code})` : '';
        msg = `${(e as { message: string }).message}${code}`;
      } else {
        try {
          msg = JSON.stringify(e);
        } catch {
          msg = String(e);
        }
      }
      setRunError(msg);
    }
  };

  const disabled = !filter.isReady || filter.isGenerating;

  return (
    <View style={[styles.container, { paddingBottom: bottom + 8 }]}>
      <ModelPicker
        models={MODEL_OPTIONS}
        selectedModel={selectedModel}
        onSelect={(m) => {
          setEntities(null);
          setRunError(null);
          setInferenceMs(null);
          setSelectedModel(m);
        }}
        label="Model"
        disabled={filter.isGenerating}
      />

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
            Downloading model…{' '}
            {Math.round((filter.downloadProgress ?? 0) * 100)}%
          </Text>
        </View>
      )}

      <ScrollView style={styles.textBox}>
        {entities ? (
          <HighlightedText source={sampleText} entities={entities} />
        ) : (
          <Text style={styles.sampleText}>{sampleText}</Text>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.runButton, disabled && styles.buttonDisabled]}
        onPress={onRun}
        disabled={disabled}
      >
        {filter.isGenerating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.runButtonText}>
            Detect PII
            {inferenceMs !== null && ` · ${inferenceMs} ms`}
          </Text>
        )}
      </TouchableOpacity>

      {runError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Run error: {runError}</Text>
        </View>
      )}
    </View>
  );
}

export default function PrivacyFilterScreenWrapper() {
  const isFocused = useIsFocused();
  return isFocused ? <PrivacyFilterScreen /> : null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    gap: 10,
  },
  textBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
  },
  sampleText: {
    fontSize: 13,
    color: '#222',
    lineHeight: 19,
  },
  highlight: {
    fontWeight: '600',
    borderRadius: 3,
  },
  runButton: {
    backgroundColor: ColorPalette.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  runButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  centerBlock: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  muted: {
    color: '#666',
    fontSize: 12,
  },
  errorBanner: {
    backgroundColor: '#fdecea',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  errorText: {
    color: '#a94442',
    fontSize: 12,
  },
});
