import { RangeDim, constr, f32, i64, method } from '../../src/core/schema';
import { createImageEmbedder } from '../../src/extensions/cv/tasks/imageEmbedding';
import { createTextEmbedder } from '../../src/extensions/nlp/tasks/textEmbedding';
import { fakeJsi } from '../support/fakeJsi';
import { tracked } from '../support/lifetime';
import type { FakeTensor } from '../support/fakeTensor';
import { STRETCH_PREPROCESSING, exported, imageBuffer, writesOutputs } from '../support/fixtures';
import { allowNativeLeaks } from '../support/setup';

const MODEL_PATH = '/models/embedder.pte';
const TOKENIZER_PATH = '/models/tokenizer.json';

describe('createImageEmbedder', () => {
  const config = { modelPath: MODEL_PATH, modelOpts: STRETCH_PREPROCESSING };

  it('returns the raw embedding vector at the model output dimension', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('forward', [f32(1, 3, 4, 4)], [f32(1, 5)])),
      execute: writesOutputs([0.1, 0.2, 0.3, 0.4, 0.5]),
    });

    const embedder = tracked(await createImageEmbedder(config));
    const embedding = await embedder.embed(imageBuffer(8, 8));

    expect(embedding).toBeInstanceOf(Float32Array);
    expect([...embedding].map((v) => Number(v.toFixed(3)))).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
  });

  it('accepts the unbatched [3, H, W] -> [D] variant', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('forward', [f32(3, 4, 4)], [f32(5)])),
    });

    const embedder = tracked(await createImageEmbedder(config));
    expect(await embedder.embed(imageBuffer(4, 4))).toHaveLength(5);
  });

  it('does not normalize or pool — that is baked into the .pte', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('forward', [f32(1, 3, 4, 4)], [f32(1, 2)])),
      execute: writesOutputs([3, 4]),
    });

    const embedder = tracked(await createImageEmbedder(config));
    expect([...(await embedder.embed(imageBuffer(4, 4)))]).toEqual([3, 4]);
  });

  it('releases everything on dispose', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('forward', [f32(1, 3, 4, 4)], [f32(1, 5)])),
    });

    const embedder = tracked(await createImageEmbedder(config));
    await embedder.embed(imageBuffer(9, 7));
    embedder.dispose();

    expect(fakeJsi.liveTensors()).toBe(0);
    expect(fakeJsi.liveModels()).toEqual([]);
  });
});

describe('createTextEmbedder', () => {
  const VOCAB = ['<pad>', 'hello', 'world', 'query:', 'document:'];
  const SEQUENCE = RangeDim(1, 8);
  const EQUAL_LENGTHS = [
    constr.eq(
      { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
      { paramSide: 'input', tensorIdx: 1, dimIdx: 1 }
    ),
  ];

  /** Records the token ids and mask each `execute` received. */
  const recordedInputs: { ids: number[]; mask: number[] }[] = [];

  const register = () => {
    recordedInputs.length = 0;
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(
        method('forward', [i64(1, SEQUENCE), i64(1, SEQUENCE)], [f32(1, 3)], EQUAL_LENGTHS)
      ),
      execute: (_methodName, inputs, out) => {
        const [ids, mask] = inputs as [FakeTensor, FakeTensor];
        recordedInputs.push({
          ids: Array.from({ length: ids.numel }, (_, i) => ids.getElement(i)),
          mask: Array.from({ length: mask.numel }, (_, i) => mask.getElement(i)),
        });
        out[0]?.setElement(0, 1);
      },
    });
    fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: VOCAB });
  };

  const config = { modelPath: MODEL_PATH, tokenizerPath: TOKENIZER_PATH };

  it('validates the declared equality constraint between ids and mask', async () => {
    register();
    const embedder = tracked(await createTextEmbedder(config));
    expect(embedder.embed).toBeInstanceOf(Function);
  });

  it('rejects a model that does not declare the equality constraint', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('forward', [i64(1, SEQUENCE), i64(1, SEQUENCE)], [f32(1, 3)])),
    });
    fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: VOCAB });

    await expect(createTextEmbedder(config)).rejects.toThrow(
      /doesn't match any of the provided variants/
    );
    allowNativeLeaks(); // see `tasks/constructionFailure.test.ts`
  });

  it('feeds tokens at their exact length with an all-ones attention mask', async () => {
    register();
    const embedder = tracked(await createTextEmbedder(config));

    await embedder.embed('hello world');

    expect(recordedInputs).toEqual([{ ids: [1, 2], mask: [1, 1] }]);
  });

  it('truncates at the model maximum sequence length rather than failing', async () => {
    register();
    const embedder = tracked(await createTextEmbedder(config));

    await embedder.embed('hello world hello world hello world hello world hello world');

    expect(recordedInputs[0]!.ids).toHaveLength(8);
  });

  it('prefixes the default prompt when one is configured', async () => {
    register();
    const embedder = tracked(await createTextEmbedder({ ...config, defaultPrompt: 'query: ' }));

    await embedder.embed('hello');

    expect(recordedInputs[0]!.ids).toEqual([3, 1]);
  });

  it('lets a per-call prompt override the default', async () => {
    register();
    const embedder = tracked(await createTextEmbedder({ ...config, defaultPrompt: 'query: ' }));

    await embedder.embed('hello', 'document: ');

    expect(recordedInputs[0]!.ids).toEqual([4, 1]);
  });

  it('rejects input that tokenizes to nothing', async () => {
    register();
    fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: [] });
    const embedder = tracked(await createTextEmbedder(config));

    await expect(embedder.embed('')).rejects.toThrow(/zero tokens/);
  });

  it('frees the per-call token tensors even when execute throws', async () => {
    register();
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(
        method('forward', [i64(1, SEQUENCE), i64(1, SEQUENCE)], [f32(1, 3)], EQUAL_LENGTHS)
      ),
      execute: () => {
        throw new Error('backend failure');
      },
    });

    const embedder = tracked(await createTextEmbedder(config));
    const before = fakeJsi.liveTensors();

    await expect(embedder.embed('hello')).rejects.toThrow('backend failure');

    expect(fakeJsi.liveTensors()).toBe(before);
  });

  it('releases the model and the tokenizer on dispose', async () => {
    register();
    const embedder = tracked(await createTextEmbedder(config));
    await embedder.embed('hello');

    embedder.dispose();

    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.liveTokenizers()).toEqual([]);
    expect(fakeJsi.liveTensors()).toBe(0);
  });

  it('accepts the unbatched [D] output variant', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(
        method('forward', [i64(1, SEQUENCE), i64(1, SEQUENCE)], [f32(3)], EQUAL_LENGTHS)
      ),
    });
    fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: VOCAB });

    const embedder = tracked(await createTextEmbedder(config));
    expect(await embedder.embed('hello')).toHaveLength(3);
  });
});
