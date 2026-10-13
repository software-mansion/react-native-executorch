import { f32, i64, method, RangeDim } from '../../src/core/schema';
import { tensor } from '../../src/core/tensor';
import { createLLMRunner } from '../../src/extensions/llm/llmRunner';
import { createLLMMultimodalRunner } from '../../src/extensions/llm/runners/llmMultimodalRunner';
import { loadModel } from '../../src/core/model';
import { loadTokenizer } from '../../src/extensions/nlp';
import { fakeJsi } from '../support/fakeJsi';
import { exported } from '../support/fixtures';
import { tracked } from '../support/lifetime';

const MODEL_PATH = '/models/test_llm.pte';
const TOKENIZER_PATH = '/models/test_tokenizer.json';

const TEXT_SPEC = exported({
  ...method('forward', [i64(1, RangeDim(1, 128)), i64(1)], [f32(1, 100)]),
  ...method('get_max_seq_len', [], [{ kind: 'Int' }]),
  ...method('get_max_context_len', [], [{ kind: 'Int' }]),
  ...method('get_vocab_size', [], [{ kind: 'Int' }]),
  ...method('use_kv_cache', [], [{ kind: 'Bool' }]),
  ...method('enable_dynamic_shape', [], [{ kind: 'Bool' }]),
  ...method('get_eos_ids', [], [{ kind: 'Int' }]),
});

const MULTIMODAL_SPEC = exported({
  ...method('text_decoder', [f32(1, RangeDim(1, 128), 64), i64(RangeDim(1, 128))], [f32(1, 100)]),
  ...method('vision_encoder', [f32(1, 3, 32, 32)], [f32(1, 4, 64)]),
  ...method('token_embedding', [i64(1, RangeDim(1, 128))], [f32(1, RangeDim(1, 128), 64)]),
  ...method('get_max_seq_len', [], [{ kind: 'Int' }]),
  ...method('get_max_context_len', [], [{ kind: 'Int' }]),
  ...method('get_vocab_size', [], [{ kind: 'Int' }]),
  ...method('use_kv_cache', [], [{ kind: 'Bool' }]),
  ...method('enable_dynamic_shape', [], [{ kind: 'Bool' }]),
  ...method('get_eos_ids', [], [{ kind: 'Int' }]),
});

const GEMMA_SPEC = exported({
  ...method(
    'token_embedding',
    [i64(1, RangeDim(1, 128))],
    [f32(1, RangeDim(1, 128), 64), f32(1, RangeDim(1, 128), 2, 8)]
  ),
  ...method(
    'text_decoder',
    [f32(1, RangeDim(1, 128), 64), f32(1, RangeDim(1, 128), 2, 8), i64(RangeDim(1, 128))],
    [f32(1, 1, 100)]
  ),
  ...method('vision_encoder', [f32(1, 3, 32, 32)], [f32(1, 4, 64)]),
  ...method(
    'audio_encoder',
    [f32(1, RangeDim(1, 7680)), i64(1)],
    [f32(1, RangeDim(1, 12), 64), f32(1, RangeDim(1, 12))]
  ),
  ...method('get_max_seq_len', [], [{ kind: 'Int' }]),
  ...method('get_max_context_len', [], [{ kind: 'Int' }]),
  ...method('get_vocab_size', [], [{ kind: 'Int' }]),
  ...method('use_kv_cache', [], [{ kind: 'Bool' }]),
  ...method('enable_dynamic_shape', [], [{ kind: 'Bool' }]),
  ...method('get_eos_ids', [], [{ kind: 'Int' }]),
});

function registerModelWithSchema(schema: any, options: { maxContextLen?: number } = {}) {
  const maxContextLen = options.maxContextLen ?? 512;
  fakeJsi.registerModel(MODEL_PATH, {
    schema,
    execute: (methodName, _inputs, outputs) => {
      switch (methodName) {
        case 'get_max_seq_len':
          return [128];
        case 'get_max_context_len':
          return [maxContextLen];
        case 'get_vocab_size':
          return [100];
        case 'use_kv_cache':
        case 'enable_dynamic_shape':
          return [true];
        case 'get_eos_ids':
          return [1];
        case 'text_decoder': {
          const out = outputs[0];
          if (out) {
            // Write a greedy choice to index 2
            out.setElement(2, 10);
          }
          return undefined;
        }
        case 'token_embedding':
        case 'vision_encoder':
        case 'audio_encoder':
        case 'forward':
        default:
          return undefined;
      }
    },
  });
}

beforeEach(() => {
  fakeJsi.registerTokenizer(TOKENIZER_PATH, {
    tokens: ['<pad>', '<eos>', 'hello', 'world', 'vision'],
    open: true,
  });
});

describe('createLLMRunner — variant dispatch & modalities validation', () => {
  it('dispatches to text runner when schema matches LLM_TEXT_SPEC', async () => {
    registerModelWithSchema(TEXT_SPEC);
    const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH));
    expect(runner).toBeDefined();
    expect(runner.modalities).toEqual([]);
  });

  it('rejects text runner if modalities are provided', async () => {
    registerModelWithSchema(TEXT_SPEC);
    await expect(createLLMRunner(MODEL_PATH, TOKENIZER_PATH, ['image'])).rejects.toThrow(
      /Text-only model does not support modalities/
    );
  });

  it('dispatches to vision multimodal runner when schema matches LLM_MULTIMODAL_SPEC', async () => {
    registerModelWithSchema(MULTIMODAL_SPEC);
    const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, ['image']));
    expect(runner).toBeDefined();
    expect(runner.modalities).toEqual(['image']);
  });

  it('rejects multimodal runner if image modality is missing', async () => {
    registerModelWithSchema(MULTIMODAL_SPEC);
    await expect(createLLMRunner(MODEL_PATH, TOKENIZER_PATH)).rejects.toThrow(
      /Multimodal vision-language model requires 'image' in modalities/
    );
  });

  it('dispatches to gemma runner when schema matches LLM_GEMMA_SPEC', async () => {
    registerModelWithSchema(GEMMA_SPEC);
    const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, ['image', 'audio']));
    expect(runner).toBeDefined();
    expect(runner.modalities).toEqual(['image', 'audio']);
  });

  it('rejects gemma runner if image or audio modality is missing', async () => {
    registerModelWithSchema(GEMMA_SPEC);
    await expect(createLLMRunner(MODEL_PATH, TOKENIZER_PATH, ['image'])).rejects.toThrow(
      /Gemma runner requires both 'image' and 'audio' in modalities/
    );
  });

  it('rejects with SCHEMA_MISMATCH on unsupported model schema', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported({
        ...method('unsupported', [f32(1)], [f32(1)]),
      }),
    });
    await expect(createLLMRunner(MODEL_PATH, TOKENIZER_PATH)).rejects.toThrow(
      /doesn't match any of the provided variants/
    );
  });
});

describe('createLLMMultimodalRunner — execution & KV cache lifecycle', () => {
  beforeEach(() => {
    registerModelWithSchema(MULTIMODAL_SPEC, { maxContextLen: 256 });
  });

  it('prefills text and updates KV cache position', async () => {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMMultimodalRunner(model, tokenizer, ['image']));

    expect(runner.getKVCacheState()).toEqual({
      pos: 0,
      maxContextLen: 256,
      remainingTokens: 256,
      usageRatio: 0,
    });

    const stats = runner.prefill('hello world');
    expect(stats.numTokens).toBe(2);
    expect(runner.getKVCacheState().pos).toBe(2);
    expect(runner.getKVCacheState().remainingTokens).toBe(254);
  });

  it('prefills image and updates KV cache position by visual tokens count', async () => {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMMultimodalRunner(model, tokenizer, ['image']));

    const img = tensor('float32', [1, 3, 32, 32]);
    try {
      const stats = runner.prefill([{ kind: 'image', image: img }]);
      expect(stats.numTokens).toBe(4); // visualTokens = 4
      expect(runner.getKVCacheState().pos).toBe(4);
    } finally {
      img.dispose();
    }
  });

  it('rejects invalid image tensor shape or dtype', async () => {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMMultimodalRunner(model, tokenizer, ['image']));

    const badDtypeImg = tensor('uint8', [1, 3, 32, 32]);
    try {
      expect(() => runner.prefill([{ kind: 'image', image: badDtypeImg }])).toThrow(
        /Expected image tensor of dtype 'float32'/
      );
    } finally {
      badDtypeImg.dispose();
    }

    const badShapeImg = tensor('float32', [1, 3, 64, 64]);
    try {
      expect(() => runner.prefill([{ kind: 'image', image: badShapeImg }])).toThrow(
        /Image tensor shape/
      );
    } finally {
      badShapeImg.dispose();
    }
  });

  it('handles interleaved text and image prompts', async () => {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMMultimodalRunner(model, tokenizer, ['image']));

    const img = tensor('float32', [1, 3, 32, 32]);
    try {
      const stats = runner.prefill(['hello', { kind: 'image', image: img }, 'world']);
      expect(stats.numTokens).toBe(1 + 4 + 1);
      expect(runner.getKVCacheState().pos).toBe(6);
    } finally {
      img.dispose();
    }
  });

  it('resets KV cache pos to 0 or valid targetPos', async () => {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMMultimodalRunner(model, tokenizer, ['image']));

    runner.prefill('hello world');
    expect(runner.getKVCacheState().pos).toBe(2);

    runner.reset(1);
    expect(runner.getKVCacheState().pos).toBe(1);

    runner.reset();
    expect(runner.getKVCacheState().pos).toBe(0);

    expect(() => runner.reset(10)).toThrow(/must be in range/);
    expect(() => runner.reset(-1)).toThrow(/must be in range/);
  });

  it('generates tokens and triggers onToken callback', async () => {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMMultimodalRunner(model, tokenizer, ['image']));

    const tokens: string[] = [];
    const stats = runner.generate('hello', { maxNewTokens: 3 }, (tok) => tokens.push(tok));

    expect(stats.numTokens).toBe(3);
    expect(tokens.length).toBe(3);
    expect(tokens).toEqual(['hello', 'hello', 'hello']);
  });

  it('stops generation early when stop() is called', async () => {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMMultimodalRunner(model, tokenizer, ['image']));

    let count = 0;
    const stats = runner.generate('hello', { maxNewTokens: 10 }, () => {
      count++;
      if (count === 2) runner.stop();
    });

    expect(stats.numTokens).toBe(2);
  });

  it('disposes underlying resources cleanly', async () => {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = createLLMMultimodalRunner(model, tokenizer, ['image']);

    runner.dispose();
    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.liveTokenizers()).toEqual([]);
    expect(fakeJsi.liveTensorDescriptions()).toEqual([]);
  });
});
