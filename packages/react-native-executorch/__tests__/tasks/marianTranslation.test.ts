import { RangeDim, constraint, f32, i64, method } from '../../src/core/schema';
import type { ConcreteDim } from '../../src/core/schema';
import { createMarianTranslator } from '../../src/extensions/nlp/tasks/marianTranslation';
import { splitSentences } from '../../src/extensions/nlp/utils/translationUtils';
import { fakeJsi } from '../support/fakeJsi';
import { tracked } from '../support/lifetime';
import type { FakeTensor } from '../support/fakeTensor';
import { exported } from '../support/fixtures';

const MODEL_PATH = '/models/opus_mt.pte';
const TOKENIZER_PATH = '/models/tokenizer.json';

const VOCAB = ['<pad>', '</s>', 'hello', 'world', 'hallo', 'welt'];
const [PAD, EOS, HALLO, WELT] = [0, 1, 4, 5];
const NUM_CROSS_KV = 12;

const config = {
  name: 'marian' as const,
  modelPath: MODEL_PATH,
  tokenizerPath: TOKENIZER_PATH,
  sourceLanguage: 'en',
  targetLanguage: 'de',
};

/** Builds the exported Opus-MT schema over a source-length domain. */
function marianSchema(source: ConcreteDim) {
  const kv = Array(NUM_CROSS_KV).fill(f32(2, source, 4));
  const kvIndices = [...Array(NUM_CROSS_KV).keys()];
  const dim = (paramSide: 'input' | 'output', tensorIdx: number) =>
    ({ paramSide, tensorIdx, dimIdx: 1 }) as const;
  return exported({
    ...method('encode', [i64(1, source), i64(1, source)], kv, [
      constraint.equality(dim('input', 0), dim('input', 1)),
      ...kvIndices.map((i) => constraint.equality(dim('input', 0), dim('output', i))),
    ]),
    ...method(
      'decode',
      [i64(1, 1), i64(1), i64(1, source), ...kv],
      [f32(1, 1, VOCAB.length)],
      kvIndices.map((i) => constraint.equality(dim('input', 2), dim('input', 3 + i)))
    ),
  });
}

const EN_DE = { sourceLanguage: 'en', targetLanguage: 'de' };

const read = (t: FakeTensor) => Array.from({ length: t.numel }, (_, i) => t.getElement(i));

/** What each `encode` received, and the decoder inputs of each step. */
const encoded: { ids: number[]; mask: number[] }[] = [];
const decoded: { token: number; position: number }[] = [];

/**
 * Registers a model whose decoder emits `target` (then `</s>`) for every
 * sentence, one token per position.
 */
function register(source: ConcreteDim, target: readonly number[] = [HALLO, WELT]) {
  encoded.length = 0;
  decoded.length = 0;
  fakeJsi.registerModel(MODEL_PATH, {
    schema: marianSchema(source),
    execute: (methodName, inputs, outputs) => {
      if (methodName === 'encode') {
        const [ids, mask] = inputs as [FakeTensor, FakeTensor];
        encoded.push({ ids: read(ids), mask: read(mask) });
        return;
      }
      const [token, position] = inputs as [FakeTensor, FakeTensor];
      const pos = position.getElement(0);
      decoded.push({ token: token.getElement(0), position: pos });
      const logits = outputs[0]!;
      for (let i = 0; i < logits.numel; i++) logits.setElement(i, 0);
      logits.setElement(target[pos] ?? EOS, 1);
    },
  });
  fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: VOCAB, specialIds: [PAD, EOS] });
}

describe('createMarianTranslator', () => {
  it('encodes the source with </s> and decodes greedily from <pad> until </s>', async () => {
    register(RangeDim(1, 8));
    const translator = tracked(await createMarianTranslator(config));

    expect(await translator.translate('hello world', EN_DE)).toBe('hallo welt');
    expect(encoded).toEqual([{ ids: [2, 3, EOS], mask: [1, 1, 1] }]);
    expect(decoded).toEqual([
      { token: PAD, position: 0 },
      { token: HALLO, position: 1 },
      { token: WELT, position: 2 },
    ]);
  });

  it('does not append a second </s> when the tokenizer already adds one', async () => {
    register(RangeDim(1, 8));
    fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: VOCAB, suffix: [EOS] });
    const translator = tracked(await createMarianTranslator(config));

    await translator.translate('hello world', EN_DE);
    expect(encoded[0]!.ids).toEqual([2, 3, EOS]);
  });

  it('pads and masks the source when the export fixes its length', async () => {
    register(RangeDim(6, 6));
    const translator = tracked(await createMarianTranslator(config));

    expect(await translator.translate('hello world', EN_DE)).toBe('hallo welt');
    expect(encoded).toEqual([{ ids: [2, 3, EOS, PAD, PAD, PAD], mask: [1, 1, 1, 0, 0, 0] }]);
  });

  it('truncates a long sentence to the maximum source length, ending in </s>', async () => {
    register(RangeDim(1, 4));
    const translator = tracked(await createMarianTranslator(config));

    await translator.translate('hello world hello world hello', EN_DE);
    expect(encoded[0]!.ids).toEqual([2, 3, 2, EOS]);
  });

  it('translates sentence by sentence and keeps line breaks', async () => {
    register(RangeDim(1, 8));
    const translator = tracked(await createMarianTranslator(config));

    const text = await translator.translate('hello. world!\n\nhello', EN_DE);
    expect(text).toBe('hallo welt hallo welt\n\nhallo welt');
    expect(encoded).toHaveLength(3);
  });

  it('streams pieces that add up to the translation', async () => {
    register(RangeDim(1, 8));
    const translator = tracked(await createMarianTranslator(config));
    const pieces: string[] = [];

    const text = await translator.translate('hello world', EN_DE, (piece) => pieces.push(piece));
    // Pieces are delivered on the RN thread, which the mock defers to a macrotask.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(pieces.join('')).toBe(text);
    expect(pieces.length).toBeGreaterThan(1);
  });

  it('stops when the decoder fills its cache without emitting </s>', async () => {
    register(RangeDim(1, 8), Array(300).fill(HALLO));
    const translator = tracked(await createMarianTranslator(config));

    await translator.translate('hello', EN_DE);
    expect(decoded).toHaveLength(256);
  });

  it("rejects a language pair other than the model's own", async () => {
    register(RangeDim(1, 8));
    const translator = tracked(await createMarianTranslator(config));

    await expect(
      translator.translate('hello', { sourceLanguage: 'de', targetLanguage: 'en' })
    ).rejects.toThrow(/only translates en to de/);
  });

  it('rejects a model without the source-length constraints', async () => {
    const kv = Array(NUM_CROSS_KV).fill(f32(2, RangeDim(1, 8), 4));
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported({
        ...method('encode', [i64(1, RangeDim(1, 8)), i64(1, RangeDim(1, 8))], kv),
        ...method(
          'decode',
          [i64(1, 1), i64(1), i64(1, RangeDim(1, 8)), ...kv],
          [f32(1, 1, VOCAB.length)]
        ),
      }),
    });
    fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: VOCAB });

    await expect(createMarianTranslator(config)).rejects.toThrow(
      /doesn't match any of the provided variants/
    );
  });

  it('releases everything on dispose', async () => {
    register(RangeDim(1, 8));
    const translator = tracked(await createMarianTranslator(config));
    await translator.translate('hello world. hello', EN_DE);
    translator.dispose();

    expect(fakeJsi.liveTensors()).toBe(0);
    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.liveTokenizers()).toEqual([]);
  });
});

describe('splitSentences', () => {
  it('splits after closing punctuation and keeps line breaks as separators', () => {
    expect(splitSentences('Hi there. How are you?\nFine!')).toEqual([
      { sentence: 'Hi there.', separator: ' ' },
      { sentence: 'How are you?', separator: '\n' },
      { sentence: 'Fine!', separator: '' },
    ]);
  });

  it('keeps closing quotes with their sentence and does not split decimals', () => {
    expect(splitSentences('He said "go." It costs 3.50 now')).toEqual([
      { sentence: 'He said "go."', separator: ' ' },
      { sentence: 'It costs 3.50 now', separator: '' },
    ]);
  });
});
