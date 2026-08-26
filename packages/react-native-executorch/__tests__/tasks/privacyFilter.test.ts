/**
 * The privacy filter pipeline.
 *
 * Unlike the other stateful pipelines, nothing here depends on real weights:
 * the model contributes one logit row per token and everything that turns those
 * rows into entity spans — the BIOES grammar, the Viterbi decode, the sliding
 * window and its overlap policy, the character offsets — is TypeScript. So this
 * suite drives the whole thing end to end, with an `execute` that emits the
 * label sequence each test wants to decode.
 *
 * The window logic is the part worth pinning down. A model exported with a
 * dynamic sequence dimension runs each window at the token count it actually
 * holds, rounded onto the grid the export accepts; a statically exported one
 * only accepts its single length and pads up to it. Both have to label every
 * token of an input longer than one window, and neither may drop the tail.
 */
import { RangeDim, f32, i64, method, constraint } from '../../src/core/schema';
import { createPrivacyFilter } from '../../src/extensions/nlp/tasks/privacyFilter';
import { fakeJsi, type FakeExecute } from '../support/fakeJsi';
import { exported } from '../support/fixtures';
import { tracked } from '../support/lifetime';
import { allowNativeLeaks } from '../support/setup';

const MODEL_PATH = '/models/privacy-filter.pte';
const TOKENIZER_PATH = '/models/tokenizer.json';
const PAD_TOKEN_ID = 9;

// One entity type is enough to exercise the grammar: BIOES is per-entity, and a
// second type only repeats the same four transitions.
const LABELS = ['O', 'B-person', 'I-person', 'E-person', 'S-person'] as const;
const L = { O: 0, B: 1, I: 2, E: 3, S: 4 } as const;

const WORDS = ['call', 'ada', 'lovelace', 'today', 'or', 'ask', 'grace', 'now', '<pad>'] as const;

const registerTokenizer = () =>
  fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: WORDS, specialIds: [PAD_TOKEN_ID] });

const dynamicSchema = (min: number, max: number, step = 1) =>
  exported(
    method(
      'forward',
      [i64(1, RangeDim(min, max, step)), i64(1, RangeDim(min, max, step))],
      [f32(1, RangeDim(min, max, step), LABELS.length)],
      [
        constraint.equality(
          { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
          { paramSide: 'input', tensorIdx: 1, dimIdx: 1 },
          { paramSide: 'output', tensorIdx: 0, dimIdx: 1 }
        ),
      ]
    )
  );

const staticSchema = (length: number) =>
  exported(method('forward', [i64(1, length), i64(1, length)], [f32(1, length, LABELS.length)]));

/**
 * An `execute` that gives each token the label `labelFor` picks for it, by
 * writing a large logit into that column. Tokens are identified by their id
 * rather than by position, so the same fixture serves every window.
 * @param labelFor Maps a token id to the label index it should decode to.
 * @returns The execute implementation.
 */
const labels = (labelFor: (tokenId: number) => number): FakeExecute => {
  return (_methodName, inputs, outputs) => {
    const ids = inputs[0] as { numel: number; getElement: (i: number) => number };
    const logits = outputs[0]!;
    const length = ids.numel;
    for (let position = 0; position < length; position++) {
      const label = labelFor(ids.getElement(position));
      for (let column = 0; column < LABELS.length; column++) {
        logits.setElement(position * LABELS.length + column, column === label ? 10 : 0);
      }
    }
  };
};

/** Every token labelled `O`, so a test can focus on the shapes that were run. */
const allBackground = labels(() => L.O);

/** The sequence length of every `forward` the fake model was asked to run. */
const runLengths: number[] = [];
beforeEach(() => runLengths.splice(0));

/** Wraps an `execute`, recording the sequence length each call was given. */
const recordingLengths =
  (inner: FakeExecute): FakeExecute =>
  (methodName, inputs, outputs) => {
    runLengths.push((inputs[0] as { shape: readonly number[] }).shape[1]!);
    inner(methodName, inputs, outputs);
  };

const config = {
  modelPath: MODEL_PATH,
  tokenizerPath: TOKENIZER_PATH,
  modelOpts: { labelNames: LABELS, padTokenId: PAD_TOKEN_ID },
};

beforeEach(registerTokenizer);

describe('createPrivacyFilter — the label space', () => {
  beforeEach(() => {
    fakeJsi.registerModel(MODEL_PATH, { schema: dynamicSchema(2, 8) });
  });

  it.each([
    ['an empty label list', []],
    ["a list that does not start with 'O'", ['B-person', 'O']],
  ])('rejects %s', async (_label, labelNames) => {
    await expect(
      createPrivacyFilter({ ...config, modelOpts: { labelNames, padTokenId: PAD_TOKEN_ID } })
    ).rejects.toThrow(/labelNames/);
  });

  it('rejects a model whose logits are wider than the label space', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(
        method(
          'forward',
          [i64(1, RangeDim(2, 8)), i64(1, RangeDim(2, 8))],
          [f32(1, RangeDim(2, 8), LABELS.length + 1)]
        )
      ),
    });

    await expect(createPrivacyFilter(config)).rejects.toThrow(
      /output #0 Tensor dim #2: Constant dimension mismatch/
    );
    allowNativeLeaks(); // see `tasks/constructionFailure.test.ts`
  });

  it('rejects a window too short to hold a span and its context', async () => {
    fakeJsi.registerModel(MODEL_PATH, { schema: staticSchema(1) });

    await expect(createPrivacyFilter(config)).rejects.toThrow(/at least 2 tokens/);
    allowNativeLeaks(); // see `tasks/constructionFailure.test.ts`
  });
});

describe('createPrivacyFilter — decoding', () => {
  beforeEach(() => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: dynamicSchema(2, 8),
      // "ada lovelace" is a two-token person; everything else is background.
      execute: labels((id) => (id === 1 ? L.B : id === 2 ? L.E : L.O)),
    });
  });

  it('extracts a multi-token span with its text and token range', async () => {
    const filter = tracked(await createPrivacyFilter(config));

    const entities = await filter.detectPii('call ada lovelace today');

    expect(entities).toEqual([
      {
        label: 'person',
        text: 'ada lovelace',
        startToken: 1,
        endToken: 3,
        charStart: expect.any(Number),
        charEnd: expect.any(Number),
      },
    ]);
  });

  it('reports character offsets that slice the span back out of the input', async () => {
    const filter = tracked(await createPrivacyFilter(config));
    const input = 'call ada lovelace today';

    const [entity] = await filter.detectPii(input);

    expect(input.slice(entity!.charStart, entity!.charEnd).trim()).toBe('ada lovelace');
  });

  it('returns nothing for an empty input, without running the model', async () => {
    const filter = tracked(await createPrivacyFilter(config));

    expect(await filter.detectPii('')).toEqual([]);
    expect(fakeJsi.executions()).toEqual([]);
  });

  it('returns nothing when every token decodes to background', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: dynamicSchema(2, 8),
      execute: recordingLengths(allBackground),
    });
    const filter = tracked(await createPrivacyFilter(config));

    expect(await filter.detectPii('call ada lovelace today')).toEqual([]);
  });

  it('splits two adjacent spans of the same type at the second opener', async () => {
    // `B` after `E` starts a new span rather than extending the previous one —
    // otherwise two people standing next to each other read as one name.
    fakeJsi.registerModel(MODEL_PATH, {
      schema: dynamicSchema(2, 8),
      execute: labels((id) => (id === 1 || id === 6 ? L.S : L.O)),
    });
    const filter = tracked(await createPrivacyFilter(config));

    const entities = await filter.detectPii('ask ada grace now');

    expect(entities.map((entity) => entity.text)).toEqual(['ada', 'grace']);
  });

  it('runs synchronously on the caller thread through the worklet variant', async () => {
    const filter = tracked(await createPrivacyFilter(config));

    expect(filter.detectPiiWorklet('call ada lovelace today').map((e) => e.text)).toEqual([
      'ada lovelace',
    ]);
  });

  it('releases the model and the tokenizer on dispose', async () => {
    const filter = await createPrivacyFilter(config);

    filter.dispose();

    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.liveTokenizers()).toEqual([]);
    expect(fakeJsi.liveTensors()).toBe(0);
  });
});

describe('createPrivacyFilter — windowing', () => {
  // Eight tokens, so a four-token window has to slide to reach the tail.
  const EIGHT_TOKENS = 'call ada lovelace today or ask grace now';

  it('labels every token of an input longer than one window', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: dynamicSchema(2, 4),
      // The last token of the input is the only entity, so it is only found if
      // the final window is actually run and its tail is not discarded.
      execute: labels((id) => (id === 7 ? L.S : L.O)),
    });
    const filter = tracked(await createPrivacyFilter(config));

    const entities = await filter.detectPii(EIGHT_TOKENS);

    expect(entities.map((entity) => entity.text)).toEqual(['now']);
    expect(entities[0]!.startToken).toBe(7);
  });

  it('overlaps consecutive windows rather than tiling them', async () => {
    fakeJsi.registerModel(MODEL_PATH, { schema: dynamicSchema(2, 4), execute: allBackground });
    const filter = tracked(await createPrivacyFilter(config));

    await filter.detectPii(EIGHT_TOKENS);

    // Tiling eight tokens into a four-token window would take two passes; the
    // 50% overlap that gives boundary tokens a centred second look takes four.
    expect(fakeJsi.executions().length).toBeGreaterThan(2);
  });

  it('runs a dynamic export at the token count each window holds', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: dynamicSchema(2, 8),
      execute: recordingLengths(allBackground),
    });
    const filter = tracked(await createPrivacyFilter(config));

    await filter.detectPii('call ada lovelace');

    // Three tokens, a window of eight: a dynamic export pays for three.
    expect(runLengths).toEqual([3]);
  });

  it('rounds a dynamic run up onto the grid the export accepts', async () => {
    // Exported for 2, 6, 10, …: a three-token input cannot run at 3.
    fakeJsi.registerModel(MODEL_PATH, {
      schema: dynamicSchema(2, 10, 4),
      execute: recordingLengths(allBackground),
    });
    const filter = tracked(await createPrivacyFilter(config));

    await filter.detectPii('call ada lovelace');

    expect(runLengths).toEqual([6]);
  });

  it('pads a static export up to its single accepted length', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: staticSchema(8),
      execute: recordingLengths(allBackground),
    });
    const filter = tracked(await createPrivacyFilter(config));

    await filter.detectPii('call ada lovelace');

    expect(runLengths).toEqual([8]);
  });

  it('masks the padding a static export is fed', async () => {
    const masks: number[][] = [];
    fakeJsi.registerModel(MODEL_PATH, {
      schema: staticSchema(8),
      execute: (methodName, inputs, outputs) => {
        const mask = inputs[1] as { numel: number; getElement: (i: number) => number };
        masks.push([...Array(mask.numel).keys()].map((i) => mask.getElement(i)));
        allBackground(methodName, inputs, outputs);
      },
    });
    const filter = tracked(await createPrivacyFilter(config));

    await filter.detectPii('call ada lovelace');

    // Three real tokens attended to, five padding slots masked out.
    expect(masks).toEqual([[1, 1, 1, 0, 0, 0, 0, 0]]);
  });
});
