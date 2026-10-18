import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import {
  models,
  RnExecuTorchError,
  useLLMChatSession,
  useTokenizer,
  type llm,
} from 'react-native-executorch';
import { Button } from '../../components/Button';
import { ModelStatus } from '../../components/ModelStatus';
import ScreenWrapper from '../../components/ScreenWrapper';
import { theme } from '../../theme';

const MODEL = models.llm.LFM2_5_350M.XNNPACK_8DA4W;
const COLORS = { amber: '#eea532', jade: '#2baf87', violet: '#9465db' };
const OPTIONS = {
  color: Object.keys(COLORS),
  effect: ['healing', 'flight', 'invisibility'],
  rarity: ['common', 'rare', 'legendary'],
};
type Field = keyof typeof OPTIONS;
const FIELDS: Field[] = ['color', 'effect', 'rarity'];
// A finite choice grammar: each complete recipe has one canonical token path.
const RECIPES = OPTIONS.color.flatMap((color) =>
  OPTIONS.effect.flatMap((effect) => OPTIONS.rarity.map((rarity) => ({ color, effect, rarity })))
);

function PotionLab() {
  const [loadStarted, setLoadStarted] = useState(false);
  const [selected, setSelected] = useState<Record<Field, string[]>>({
    color: ['amber', 'jade'],
    effect: ['healing', 'flight'],
    rarity: ['rare'],
  });
  const [showRecipes, setShowRecipes] = useState(false);
  const [constrained, setConstrained] = useState(true);
  const [paths, setPaths] = useState<number[][]>([]);
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [runError, setRunError] = useState('');
  const session = useLLMChatSession(MODEL, {
    preventLoad: !loadStarted,
    resetOnTurn: true,
    stopRegex: /\}$/,
    initialMessages: [
      {
        role: 'system',
        content:
          'You are a fantasy alchemist. Reply with only a JSON object: ' +
          '"color": "amber", "jade", or "violet"; ' +
          '"effect": "healing", "flight", or "invisibility"; ' +
          '"rarity": "common", "rare", or "legendary". ' +
          'Use exactly these three keys in that order, without markdown or explanation.',
      },
    ],
  });
  const {
    encode,
    decode,
    error: tokenizerError,
  } = useTokenizer(session.resource?.tokenizerPath ?? MODEL.tokenizerPath, {
    preventLoad: !session.resource,
  });

  useEffect(() => {
    if (!encode || !decode) return;
    let cancelled = false;
    const prepare = async () => {
      const empty = await encode('');
      const compiled = await Promise.all(
        RECIPES.map(async (recipe) => {
          const json = JSON.stringify(recipe);
          const encoded = await encode(json);
          // Remove tokenizer-added BOS/EOS tokens before constraining generated output.
          let start = 0;
          let end = encoded.length;
          while (start < end && start < empty.length && encoded[start] === empty[start]) start++;
          let suffix = empty.length - 1;
          while (end > start && suffix >= start && encoded[end - 1] === empty[suffix]) {
            end--;
            suffix--;
          }
          const tokens = encoded.slice(start, end);
          if (!tokens.length || (await decode(tokens, true)) !== json) {
            throw RnExecuTorchError('INVALID_STATE', 'Cannot tokenize potion recipes losslessly.');
          }
          return Array.from(tokens);
        })
      );
      if (!cancelled) setPaths(compiled);
    };
    prepare().catch((error: unknown) => {
      if (!cancelled) setRunError(error instanceof Error ? error.message : String(error));
    });
    return () => {
      cancelled = true;
    };
  }, [encode, decode]);

  const permittedRecipes = RECIPES.filter((recipe) =>
    FIELDS.every((field) => selected[field].includes(recipe[field]))
  );
  const allowedPaths = paths.filter((_, index) =>
    FIELDS.every((field) => selected[field].includes(RECIPES[index]![field]))
  );
  const toggleOption = (field: Field, value: string) => {
    const values = selected[field];
    if (busy || (values.length === 1 && values.includes(value))) return;
    setSelected({
      ...selected,
      [field]: values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    });
    setOutput('');
    setRunError('');
  };

  const brew = async () => {
    if (!session.sendMessage || busy || !allowedPaths.length) return;
    const recipePaths = allowedPaths;
    setBusy(true);
    setOutput('');
    setRunError('');
    const constraints: llm.SamplingConstraintsCallback = ({ generatedTokens }) => {
      'worklet';
      // Hermes TypedArray.from expects array-like input; a Set can produce an
      // empty typed array even when Set.size > 0, masking the entire vocabulary.
      const allowed: number[] = [];
      for (const path of recipePaths) {
        if (path.length <= generatedTokens.length) continue;
        let matches = true;
        for (let i = 0; i < generatedTokens.length; i++) {
          if (path[i] !== generatedTokens[i]) {
            matches = false;
            break;
          }
        }
        const next = path[generatedTokens.length]!;
        if (matches && !allowed.includes(next)) allowed.push(next);
      }
      if (!allowed.length) {
        throw RnExecuTorchError('INVALID_STATE', 'No valid potion continuation.');
      }
      return { allowedTokens: Int32Array.from(allowed) };
    };
    try {
      await session.sendMessage(
        `Create a potion. Choose one value per field from these allowed options: ${JSON.stringify(selected)}. ` +
          'Reply with only the JSON object, in color, effect, rarity order.',
        (token) => setOutput((text) => text + token),
        {
          temperature: 0.9,
          maxNewTokens: constrained ? Math.max(...recipePaths.map((path) => path.length)) : 160,
          constraints: constrained ? constraints : undefined,
        }
      );
    } catch (error) {
      setRunError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };
  let potion: (typeof RECIPES)[number] | undefined;
  try {
    const parsed = JSON.parse(output);
    if (parsed && Object.keys(parsed).length === 3) {
      potion = permittedRecipes.find((recipe) =>
        FIELDS.every((field) => recipe[field] === parsed[field])
      );
    }
  } catch {
    // Streaming JSON is incomplete until the closing brace arrives.
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <Text style={styles.title}>🧪 Potion Lab</Text>
      <Text style={styles.description}>Model: LFM2.5 350M · XNNPACK · 8DA4W</Text>
      <Text style={styles.description}>
        Choose which values each JSON field may contain, then let the model pick a potion.
      </Text>
      {!loadStarted ? (
        <View style={styles.row}>
          <Button title="Load model" onPress={() => setLoadStarted(true)} />
        </View>
      ) : (
        <ModelStatus
          isReady={session.isReady && paths.length > 0}
          downloadProgress={session.downloadProgress}
          error={session.error?.message ?? tokenizerError?.message}
        />
      )}
      <View style={styles.card}>
        <Text style={styles.heading}>Allowed values</Text>
        <Text style={styles.description}>
          Select one or more options per field. Keep just one to lock that field.
        </Text>
        {FIELDS.map((field) => (
          <View key={field} style={styles.field}>
            <Text style={styles.heading}>{field}</Text>
            <View style={styles.options}>
              {OPTIONS[field].map((value) => {
                const checked = selected[field].includes(value);
                const disabled = busy || (checked && selected[field].length === 1);
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`${field}: ${value}`}
                    accessibilityState={{ checked, disabled }}
                    disabled={disabled}
                    style={[styles.chip, checked && styles.selectedChip]}
                    onPress={() => toggleOption(field, value)}
                  >
                    <Text style={[styles.description, checked && styles.selectedText]}>
                      {checked ? '✓ ' : ''}
                      {value}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.heading}>Constrain output</Text>
            <Text style={styles.description}>
              Compare the same prompt with the token filter on or off.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Constrain output"
            value={constrained}
            disabled={busy}
            onValueChange={(value) => {
              setConstrained(value);
              setOutput('');
              setRunError('');
            }}
          />
        </View>
        <View style={styles.row}>
          <Button
            title="Brew potion"
            onPress={brew}
            loading={busy}
            disabled={!session.isReady || !allowedPaths.length || busy}
          />
          {busy && <Button title="Stop" variant="secondary" onPress={() => session.stop?.()} />}
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>What is the grammar?</Text>
        <Text style={styles.description}>
          A grammar defines which outputs are allowed. Here it is a finite list of JSON recipes:
          exactly three fields, in color → effect → rarity order, with each value taken from your
          selections. No extra fields or explanation.
        </Text>
        <Text style={styles.code}>{JSON.stringify(selected, null, 2)}</Text>
        <Text style={styles.description}>
          These selections allow {permittedRecipes.length}{' '}
          {permittedRecipes.length === 1 ? 'recipe' : 'recipes'}. The model chooses between them. At
          each step, the sampler only allows tokens that can still complete one of these recipes.
          This demo uses a finite recipe list, not a general JSON grammar parser.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showRecipes }}
          onPress={() => setShowRecipes((value) => !value)}
        >
          <Text style={styles.heading}>
            {showRecipes ? 'Hide' : 'Show'} permitted recipes ({permittedRecipes.length})
          </Text>
        </Pressable>
        {showRecipes && (
          <Text selectable style={styles.code}>
            {permittedRecipes.map((recipe) => JSON.stringify(recipe)).join('\n\n')}
          </Text>
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Live output</Text>
        <Text style={styles.description}>
          {constrained
            ? 'Token filter ON — only the permitted recipes can be generated.'
            : 'Token filter OFF — the model is only asked to follow the same options in the prompt.'}
        </Text>
        <Text selectable style={styles.code}>
          {output || 'Your potion’s JSON appears here…'}
        </Text>
        {potion && (
          <Text style={[styles.potion, { color: COLORS[potion.color as keyof typeof COLORS] }]}>
            ✦ {potion.color} · {potion.rarity} potion of {potion.effect}
          </Text>
        )}
        {!busy && output && !potion && (
          <Text accessibilityRole="alert" style={styles.invalidOutput}>
            Output does not match your allowed values and three-field recipe.
          </Text>
        )}
        {!!runError && (
          <Text accessibilityRole="alert" style={styles.error}>
            {runError}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

export default function ConstrainedDecodingScreen() {
  return (
    <ScreenWrapper>
      <PotionLab />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40, gap: 16, backgroundColor: theme.colors.background },
  title: { color: theme.colors.primary, fontSize: 30, fontWeight: '700' },
  heading: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' },
  description: { color: theme.colors.textMuted, lineHeight: 21 },
  card: { padding: 16, borderRadius: 16, backgroundColor: '#fff', gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 4 },
  field: { gap: 8 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.lightBorder,
  },
  selectedChip: { backgroundColor: '#f0e9fa', borderColor: '#734cb0' },
  selectedText: { color: '#6034a3', fontWeight: '600' },
  code: {
    padding: 16,
    minHeight: 100,
    borderRadius: 8,
    backgroundColor: '#191d32',
    color: '#d6e6c5',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 22,
  },
  potion: { fontSize: 20, fontWeight: '700', textTransform: 'capitalize' },
  error: { color: theme.colors.errorText },
  invalidOutput: {
    color: theme.colors.errorText,
    backgroundColor: theme.colors.errorBackground,
    padding: 12,
    borderRadius: 8,
    fontWeight: '600',
    lineHeight: 21,
  },
});
