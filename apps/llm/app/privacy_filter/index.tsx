import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  models,
  PiiEntity,
  PrivacyFilterModelSources,
  usePrivacyFilter,
} from 'react-native-executorch';

const privacyFilter = models.privacy_filter;
import ColorPalette from '../../colors';
import { ModelOption, ModelPicker } from '../../components/ModelPicker';
import {
  displayNameForLabel,
  SECTION_ORDER,
  SECTIONS,
  SectionKey,
  sectionForLabel,
} from '../../utils/piiCategories';

/* cspell:disable */
const OPENAI_SAMPLE = `My name is Sarah Chen and I work as a senior engineer at Acme Corp. You can reach me at sarah.chen@acmecorp.io or call my direct line at (415) 923-0847. For billing inquiries, my account number is ACC-8821-4490-3371.

I've been living at 17 Birchwood Lane, Portland, OR 97201 since October 3rd, 2019. Before that I was at 8 Rue de Rivoli, Paris, 75001, France. My personal website is https://sarahchen.dev and my GitHub is https://github.com/schen-eng. Feel free to connect — I usually respond within a business day.

My date of birth is June 12, 1991, and my backup email is s.chen.personal@gmail.com in case the primary address is unreachable. This message also contains a confidential API key: sk-T93kXpLm2NvBqR7dYwZ4. Please do not share it outside the team. You can also reach my colleague James Okonkwo at j.okonkwo@acmecorp.io or at his mobile +44 7911 123456.`;

const NEMOTRON_SAMPLE = `Patient intake for Maya Sato, female, age 47, blood type O negative, born 09/18/1978. Race: Asian. Religion: Buddhist. MRN 4872910; health plan beneficiary number 552993177 with Aetna. SSN 412-55-7821, national ID DNI 88-7762-X. Primary occupation: registered nurse.

Reach her at maya.sato@example.com or +1 (415) 555-0142. Mailing address: 84 Cedar Hill Road, Apt 3B, Berkeley, CA 94703, United States. Vehicle plate 7XKL922; driver license CA-D1294883.

Payment for last visit: Visa ending 4992-1133-7820-4419, expires 11/28, CVV 884. Bank routing 021000089, SWIFT BIC CHASUS33. Employer EIN tax ID 47-3320118. Customer ID CUST-553201, employee ID EMP-A0093.

Workstation MAC 3C:22:FB:8E:01:9A, IPv4 10.0.42.118, device IMEI 359888061234560. Service account API key sk-live-Tn8x3pLm2NvBqR7dYwZ4QF, password Hunter2!Spring.`;
/* cspell:enable */

const MODEL_OPTIONS: ModelOption<PrivacyFilterModelSources>[] = [
  {
    label: 'OpenMed Nemotron (55 entities)',
    value: privacyFilter.nemotron(),
  },
  {
    label: 'OpenAI Privacy Filter (8 entities)',
    value: privacyFilter.openai(),
  },
];

function sampleFor(model: PrivacyFilterModelSources): string {
  return model.modelName === privacyFilter.nemotron().modelName
    ? NEMOTRON_SAMPLE
    : OPENAI_SAMPLE;
}

function modelDisplayName(model: PrivacyFilterModelSources): string {
  return model.modelName === privacyFilter.nemotron().modelName
    ? 'Nemotron'
    : 'OpenAI';
}

function labelCountFor(model: PrivacyFilterModelSources): {
  bioes: number;
  entityTypes: number;
} {
  const isNemotron = model.modelName === privacyFilter.nemotron().modelName;
  return isNemotron
    ? { bioes: 221, entityTypes: 55 }
    : { bioes: 33, entityTypes: 8 };
}

interface GroupedEntity {
  label: string;
  text: string;
}

interface Section {
  key: SectionKey;
  entities: GroupedEntity[];
}

function groupEntities(entities: PiiEntity[]): Section[] {
  const seen = new Set<string>();
  const buckets: Record<SectionKey, GroupedEntity[]> = {
    patient: [],
    medical: [],
    contact: [],
    address: [],
    financial: [],
    identifiers: [],
    technical: [],
    other: [],
  };
  for (const e of entities) {
    const text = e.text?.trim();
    if (!text) continue;
    const key = `${e.label}::${text.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    buckets[sectionForLabel(e.label)].push({ label: e.label, text });
  }
  return SECTION_ORDER.filter((k) => buckets[k].length > 0).map((k) => ({
    key: k,
    entities: buckets[k],
  }));
}

function EntityCard({
  entity,
  section,
  delay,
}: {
  entity: GroupedEntity;
  section: SectionKey;
  delay: number;
}) {
  const meta = SECTIONS[section];
  return (
    <Animated.View
      // cspell:disable-next-line
      entering={FadeInDown.delay(delay).duration(280).springify().damping(18)}
      style={[
        styles.card,
        {
          backgroundColor: meta.fill,
          borderColor: meta.border,
          shadowColor: meta.dot,
        },
      ]}
    >
      <Text style={[styles.cardLabel, { color: meta.label }]} numberOfLines={1}>
        {displayNameForLabel(entity.label).toUpperCase()}
      </Text>
      <Text style={[styles.cardValue, { color: meta.value }]} numberOfLines={2}>
        {entity.text}
      </Text>
      <View style={[styles.chip, { backgroundColor: meta.chipBg }]}>
        <Text
          style={[styles.chipText, { color: meta.chipText }]}
          numberOfLines={1}
        >
          {entity.label}
        </Text>
      </View>
    </Animated.View>
  );
}

function SectionBlock({
  section,
  baseDelay,
}: {
  section: Section;
  baseDelay: number;
}) {
  const meta = SECTIONS[section.key];
  return (
    <Animated.View
      entering={FadeIn.delay(baseDelay).duration(220)}
      style={styles.section}
    >
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: meta.dot }]} />
        <Text style={styles.sectionTitle}>{meta.title}</Text>
        <View
          style={[styles.sectionCountChip, { backgroundColor: meta.chipBg }]}
        >
          <Text style={[styles.sectionCountText, { color: meta.chipText }]}>
            {section.entities.length}
          </Text>
        </View>
      </View>
      <View style={styles.cardGrid}>
        {section.entities.map((e, i) => (
          <EntityCard
            key={`${e.label}-${i}`}
            entity={e}
            section={section.key}
            delay={baseDelay + i * 30}
          />
        ))}
      </View>
    </Animated.View>
  );
}

function PrivacyFilterScreen() {
  const { bottom } = useSafeAreaInsets();
  const [entities, setEntities] = useState<PiiEntity[] | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [inferenceMs, setInferenceMs] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<PrivacyFilterModelSources>(
    privacyFilter.nemotron()
  );

  const filter = usePrivacyFilter({ model: selectedModel });
  const sampleText = sampleFor(selectedModel);
  const counts = labelCountFor(selectedModel);
  const modelName = modelDisplayName(selectedModel);

  const sections = useMemo(
    () => (entities ? groupEntities(entities) : []),
    [entities]
  );
  const totalFields = useMemo(
    () => sections.reduce((s, sec) => s + sec.entities.length, 0),
    [sections]
  );

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
      setRunError(e instanceof Error ? e.message : String(e));
    }
  };

  const disabled = !filter.isReady || filter.isGenerating;
  const hasResult = entities !== null;

  return (
    <View style={[styles.container, { paddingBottom: bottom + 12 }]}>
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

      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.modelPill}>
            <View style={styles.modelPillDot} />
            <Text style={styles.modelPillText}>{modelName}</Text>
          </View>
          <Text style={styles.headerMeta}>
            {counts.bioes} BIOES · {counts.entityTypes} types
          </Text>
        </View>
        {hasResult && (
          <Animated.View
            entering={FadeIn.duration(220)}
            style={styles.timingBadge}
          >
            <Text style={styles.timingBadgeNumber}>{totalFields}</Text>
            <Text style={styles.timingBadgeLabel}>fields</Text>
            <View style={styles.timingBadgeDivider} />
            <Text style={styles.timingBadgeNumber}>{inferenceMs}</Text>
            <Text style={styles.timingBadgeLabel}>ms</Text>
          </Animated.View>
        )}
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
            Downloading model…{' '}
            {Math.round((filter.downloadProgress ?? 0) * 100)}%
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!hasResult ? (
          <Animated.View
            entering={FadeIn.duration(220)}
            style={styles.sampleCard}
          >
            <Text style={styles.sampleHint}>Input</Text>
            <Text style={styles.sampleText}>{sampleText}</Text>
          </Animated.View>
        ) : sections.length === 0 ? (
          <Text style={styles.muted}>No PII detected.</Text>
        ) : (
          sections.map((s, i) => (
            <SectionBlock key={s.key} section={s} baseDelay={i * 70} />
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.88}
        style={[styles.runButton, disabled && styles.buttonDisabled]}
        onPress={onRun}
        disabled={disabled}
      >
        {filter.isGenerating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.runButtonText}>
            {hasResult ? 'Run again' : 'Detect PII'}
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

const CANVAS = '#F7F6F2';
const INK = '#13231C';
const ACCENT = '#0F4F3F';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: CANVAS,
    gap: 12,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFEDE6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
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
  headerMeta: {
    fontSize: 11,
    color: '#6E6A60',
    fontWeight: '600',
  },
  timingBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  timingBadgeNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  timingBadgeLabel: {
    color: '#C5DDD5',
    fontSize: 11,
    fontWeight: '600',
  },
  timingBadgeDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#3D6E5E',
    marginHorizontal: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 12,
    gap: 16,
  },
  sampleCard: {
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
  sampleHint: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#9B9588',
  },
  sampleText: {
    fontSize: 13,
    color: '#2A3B33',
    lineHeight: 20,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: INK,
  },
  sectionCountChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    minWidth: 18,
    alignItems: 'center',
  },
  sectionCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    flexBasis: '48.5%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardValue: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  runButton: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  runButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
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
    color: '#6E6A60',
    fontSize: 12,
  },
  errorBanner: {
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
