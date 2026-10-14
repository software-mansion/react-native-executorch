/**
 * The ColBERT (late-interaction) embedder.
 *
 * The weights are out of scope, but the input layout is not: the model only
 * reproduces its reference (PyLate) scores when every input is
 * `[BOS, prefix, ...tokens]`, queries are padded with masked expansion tokens
 * whose vectors are still kept, and documents drop their punctuation vectors.
 * A slip in any of those still produces plausible-looking vectors, so the
 * fake model below echoes each input id into its output row and the tests read
 * back which positions were fed and which were kept.
 */
import { RangeDim, constraint, f32, i64, method } from '../../src/core/schema';
import {
  createColbertEmbedder,
  maxSim,
  type ColbertEmbedderOptions,
} from '../../src/extensions/nlp/tasks/colbertEmbedding';
import { fakeJsi } from '../support/fakeJsi';
import { tracked } from '../support/lifetime';
import type { FakeTensor } from '../support/fakeTensor';
import { exported } from '../support/fixtures';

const MODEL_PATH = '/models/colbert.pte';
const TOKENIZER_PATH = '/models/tokenizer.json';

const VOCAB = ['<pad>', '<bos>', '[Q]', '[D]', '<exp>', 'hello', 'world', '.', ','];
const [BOS, Q, D, EXP, HELLO, WORLD, DOT, COMMA] = [1, 2, 3, 4, 5, 6, 7, 8];

const OPTIONS: ColbertEmbedderOptions = {
  queryPrefixToken: '[Q]',
  documentPrefixToken: '[D]',
  queryLength: 6,
  queryExpansionToken: '<exp>',
  bosToken: '<bos>',
  // '?' is not in the vocabulary and must be ignored rather than fail.
  skiplistTokens: ['.', ',', '?'],
};
const config = { modelPath: MODEL_PATH, tokenizerPath: TOKENIZER_PATH, modelOpts: OPTIONS };

const SEQ_SHARED = [
  constraint.equality(
    { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
    { paramSide: 'input', tensorIdx: 1, dimIdx: 1 },
    { paramSide: 'output', tensorIdx: 0, dimIdx: 1 }
  ),
];

/** Every `execute` call's token ids and attention mask. */
const recorded: { ids: number[]; mask: number[] }[] = [];

/**
 * Registers a 2-dimensional ColBERT model that writes `[id, position]` into
 * output row `position`, so a returned row names the input it came from.
 * @param seq The exported sequence dimension.
 */
const register = (seq = RangeDim(2, 16)) => {
  recorded.length = 0;
  const dynamic = seq.kind !== 'constant';
  fakeJsi.registerModel(MODEL_PATH, {
    schema: exported(
      method(
        'forward',
        [i64(1, seq), i64(1, seq)],
        [f32(1, seq, 2)],
        dynamic ? SEQ_SHARED : undefined
      )
    ),
    execute: (_methodName, inputs, out) => {
      const [ids, mask] = inputs as [FakeTensor, FakeTensor];
      const read = (t: FakeTensor) => Array.from({ length: t.numel }, (_, i) => t.getElement(i));
      recorded.push({ ids: read(ids), mask: read(mask) });
      for (let i = 0; i < ids.numel; i++) {
        out[0]!.setElement(2 * i, ids.getElement(i));
        out[0]!.setElement(2 * i + 1, i);
      }
    },
  });
  fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: VOCAB });
};

/** The `[id, position]` pairs of the returned rows. */
const rows = (data: Float32Array) =>
  Array.from({ length: data.length / 2 }, (_, i) => [data[2 * i], data[2 * i + 1]]);

describe('createColbertEmbedder', () => {
  it('builds queries as [BOS, [Q], ...tokens] padded with masked expansion tokens', async () => {
    register();
    const embedder = tracked(await createColbertEmbedder(config));

    const out = await embedder.embed('hello world', 'query');

    expect(recorded).toEqual([{ ids: [BOS, Q, HELLO, WORLD, EXP, EXP], mask: [1, 1, 1, 1, 0, 0] }]);
    // Expansion vectors are kept: they take part in MaxSim.
    expect(out.numTokens).toBe(6);
    expect(out.dimension).toBe(2);
    expect(rows(out.data).map(([id]) => id)).toEqual([BOS, Q, HELLO, WORLD, EXP, EXP]);
  });

  it('truncates a long query to the query length, all of it attended', async () => {
    register();
    const embedder = tracked(await createColbertEmbedder(config));

    const out = await embedder.embed('hello world hello world hello world', 'query');

    expect(recorded[0]).toEqual({
      ids: [BOS, Q, HELLO, WORLD, HELLO, WORLD],
      mask: [1, 1, 1, 1, 1, 1],
    });
    expect(out.numTokens).toBe(6);
  });

  it('feeds documents at their exact length and drops skiplisted vectors', async () => {
    register();
    const embedder = tracked(await createColbertEmbedder(config));

    const out = await embedder.embed('hello , world .', 'document');

    expect(recorded).toEqual([
      { ids: [BOS, D, HELLO, COMMA, WORLD, DOT], mask: [1, 1, 1, 1, 1, 1] },
    ]);
    expect(out.numTokens).toBe(4);
    expect(rows(out.data)).toEqual([
      [BOS, 0],
      [D, 1],
      [HELLO, 2],
      [WORLD, 4],
    ]);
  });

  it('truncates a long document to the model maximum sequence length', async () => {
    register(RangeDim(2, 8));
    const embedder = tracked(await createColbertEmbedder(config));

    const out = await embedder.embed('hello world '.repeat(10), 'document');

    expect(recorded[0]!.ids).toEqual([BOS, D, HELLO, WORLD, HELLO, WORLD, HELLO, WORLD]);
    expect(out.numTokens).toBe(8);
  });

  it('rounds the sequence up onto the exported range step, dropping the padding', async () => {
    register(RangeDim(2, 18, 4));
    const embedder = tracked(await createColbertEmbedder(config));

    const out = await embedder.embed('hello world .', 'document');

    // 5 tokens run at 6, the next length on the 2 + 4k grid.
    expect(recorded[0]).toEqual({
      ids: [BOS, D, HELLO, WORLD, DOT, EXP],
      mask: [1, 1, 1, 1, 1, 0],
    });
    expect(rows(out.data).map(([id]) => id)).toEqual([BOS, D, HELLO, WORLD]);
  });

  it('pads to the single length of a statically exported model', async () => {
    register({ kind: 'constant', value: 8 });
    const embedder = tracked(await createColbertEmbedder(config));

    const doc = await embedder.embed('hello world', 'document');
    const query = await embedder.embed('hello', 'query');

    expect(recorded.map((r) => r.mask)).toEqual([
      [1, 1, 1, 1, 0, 0, 0, 0],
      [1, 1, 1, 0, 0, 0, 0, 0],
    ]);
    expect(doc.numTokens).toBe(4);
    expect(query.numTokens).toBe(6);
  });

  it('omits BOS for a model configured without one', async () => {
    register();
    const embedder = tracked(
      await createColbertEmbedder({ ...config, modelOpts: { ...OPTIONS, bosToken: undefined } })
    );

    await embedder.embed('hello', 'document');

    expect(recorded[0]!.ids).toEqual([D, HELLO]);
  });

  it('matches the synchronous worklet entry point', async () => {
    register();
    const embedder = tracked(await createColbertEmbedder(config));

    expect(embedder.embedWorklet('hello world', 'query')).toEqual(
      await embedder.embed('hello world', 'query')
    );
  });

  it('rejects an unknown kind and input that tokenizes to nothing', async () => {
    register();
    const embedder = tracked(await createColbertEmbedder(config));

    await expect(embedder.embed('hello', 'passage' as never)).rejects.toThrow(
      /kind must be 'query' or 'document'/
    );
    fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: VOCAB });
    await expect(embedder.embed('', 'query')).rejects.toThrow(/zero tokens/);
  });

  it('rejects a configured token missing from the vocabulary, releasing everything', async () => {
    register();

    await expect(
      createColbertEmbedder({ ...config, modelOpts: { ...OPTIONS, queryPrefixToken: '[X]' } })
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'INVALID_ARGUMENT',
        message: expect.stringMatching(/queryPrefixToken '\[X\]' is not a token/),
      })
    );
    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.liveTokenizers()).toEqual([]);
  });

  it('rejects a query length the model cannot run', async () => {
    register(RangeDim(2, 4));

    await expect(createColbertEmbedder(config)).rejects.toThrow(
      /queryLength must be an integer in \(2, 4\], got 6/
    );
  });

  it('rejects a model whose output does not share the sequence length', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(
        method('forward', [i64(1, RangeDim(2, 16)), i64(1, RangeDim(2, 16))], [f32(1, 2)])
      ),
    });
    fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: VOCAB });

    await expect(createColbertEmbedder(config)).rejects.toThrow(
      /doesn't match any of the provided variants/
    );
  });

  it('frees the per-call tensors even when execute throws', async () => {
    register();
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(
        method(
          'forward',
          [i64(1, RangeDim(2, 16)), i64(1, RangeDim(2, 16))],
          [f32(1, RangeDim(2, 16), 2)],
          SEQ_SHARED
        )
      ),
      execute: () => {
        throw new Error('backend failure');
      },
    });
    const embedder = tracked(await createColbertEmbedder(config));
    const before = fakeJsi.liveTensors();

    await expect(embedder.embed('hello', 'document')).rejects.toThrow('backend failure');

    expect(fakeJsi.liveTensors()).toBe(before);
  });

  it('releases the model and the tokenizer on dispose', async () => {
    register();
    const embedder = tracked(await createColbertEmbedder(config));
    await embedder.embed('hello', 'query');

    embedder.dispose();

    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.liveTokenizers()).toEqual([]);
    expect(fakeJsi.liveTensors()).toBe(0);
  });
});

describe('maxSim', () => {
  const embeddings = (vectors: number[][]) => ({
    data: new Float32Array(vectors.flat()),
    numTokens: vectors.length,
    dimension: vectors[0]?.length ?? 2,
  });

  it('sums, over query vectors, the best dot product with any document vector', () => {
    const query = embeddings([
      [1, 0],
      [0, 1],
    ]);
    const document = embeddings([
      [0.6, 0.8],
      [1, 0],
      [0, -1],
    ]);

    // max(0.6, 1, 0) + max(0.8, 0, -1)
    expect(maxSim(query, document)).toBeCloseTo(1.8);
  });

  it('scores a document with no vectors 0', () => {
    expect(
      maxSim(embeddings([[1, 0]]), { data: new Float32Array(0), numTokens: 0, dimension: 2 })
    ).toBe(0);
  });

  it('rejects embeddings of different dimensions', () => {
    expect(() => maxSim(embeddings([[1, 0]]), embeddings([[1, 0, 0]]))).toThrow(
      /dimensions differ \(2 vs 3\)/
    );
  });
});
