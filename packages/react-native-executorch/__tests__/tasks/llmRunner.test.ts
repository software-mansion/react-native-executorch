import { constraint, f32, i64, method, RangeDim } from '../../src/core/schema';
import { tensor } from '../../src/core/tensor';
import { createLLMRunner } from '../../src/extensions/llm/llmRunner';
import { createLLMMultimodalRunner } from '../../src/extensions/llm/runners/llmMultimodalRunner';
import { createLLMGemmaRunner } from '../../src/extensions/llm/runners/llmGemmaRunner';
import { loadModel } from '../../src/core/model';
import { loadTokenizer } from '../../src/extensions/nlp';
import { fakeJsi } from '../support/fakeJsi';
import type { FakeTensor } from '../support/fakeTensor';
import { llm as fakeSampler } from '../support/fakeOps';
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

const VISION_SPEC = exported({
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

// 16 kHz waveform of 400 + 160k samples (k <= 20), 8 frames per audio token.
const AUDIO_SPEC = exported({
  ...method('text_decoder', [f32(1, RangeDim(1, 128), 64), i64(RangeDim(1, 128))], [f32(1, 100)]),
  ...method('audio_encoder', [f32(1, RangeDim(400, 3600, 160))], [f32(1, RangeDim(1, 3), 64)]),
  ...method('token_embedding', [i64(1, RangeDim(1, 128))], [f32(1, RangeDim(1, 128), 64)]),
  ...method('get_audio_frames_per_token', [], [{ kind: 'Int' }]),
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
    [f32(1, RangeDim(1, 128), 64), f32(1, RangeDim(1, 128), 2, 8)],
    [
      constraint.equality(
        { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
        { paramSide: 'output', tensorIdx: 0, dimIdx: 1 },
        { paramSide: 'output', tensorIdx: 1, dimIdx: 1 }
      ),
    ]
  ),
  ...method(
    'text_decoder',
    [f32(1, RangeDim(1, 128), 64), f32(1, RangeDim(1, 128), 2, 8), i64(RangeDim(1, 128))],
    [f32(1, 1, 100)],
    [
      constraint.equality(
        { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
        { paramSide: 'input', tensorIdx: 1, dimIdx: 1 },
        { paramSide: 'input', tensorIdx: 2, dimIdx: 0 }
      ),
    ]
  ),
  ...method('vision_encoder', [f32(1, 3, 32, 32)], [f32(1, 4, 64)]),
  ...method(
    'audio_encoder',
    [f32(1, RangeDim(1, 7680)), i64(1)],
    [f32(1, RangeDim(1, 12), 64), f32(1, RangeDim(1, 12))],
    [
      constraint.equality(
        { paramSide: 'output', tensorIdx: 0, dimIdx: 1 },
        { paramSide: 'output', tensorIdx: 1, dimIdx: 1 }
      ),
    ]
  ),
  ...method('get_max_seq_len', [], [{ kind: 'Int' }]),
  ...method('get_max_context_len', [], [{ kind: 'Int' }]),
  ...method('get_vocab_size', [], [{ kind: 'Int' }]),
  ...method('use_kv_cache', [], [{ kind: 'Bool' }]),
  ...method('enable_dynamic_shape', [], [{ kind: 'Bool' }]),
  ...method('get_eos_ids', [], [{ kind: 'Int' }]),
});

function registerModelWithSchema(
  schema: any,
  options: {
    maxContextLen?: number;
    tokenIds?: readonly number[];
    onForward?: (inputs: readonly FakeTensor[]) => void;
    onAudioEncode?: (inputs: readonly FakeTensor[]) => void;
  } = {}
) {
  const maxContextLen = options.maxContextLen ?? 512;
  let step = 0;
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
        case 'get_audio_frames_per_token':
          return [8];
        case 'forward':
        case 'text_decoder': {
          options.onForward?.(_inputs as readonly FakeTensor[]);
          const out = outputs[0];
          if (out && (options.tokenIds || methodName === 'text_decoder')) {
            for (let i = 0; i < out.numel; i++) out.setElement(i, 0);
            out.setElement(options.tokenIds ? (options.tokenIds[step++] ?? 1) : 2, 10);
          }
          return undefined;
        }
        case 'audio_encoder': {
          options.onAudioEncode?.(_inputs as readonly FakeTensor[]);
          const mask = outputs[1];
          if (mask) {
            for (let i = 0; i < mask.numel; i++) {
              mask.setElement(i, 1);
            }
          }
          return undefined;
        }
        case 'token_embedding':
        case 'vision_encoder':
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

describe.each([
  ['text', TEXT_SPEC, []],
  ['vision', VISION_SPEC, ['image']],
  ['gemma', GEMMA_SPEC, ['image', 'audio']],
] as const)('%s runner — streaming UTF-8', (_name, schema, modalities) => {
  function registerBytes(pieces: readonly (readonly number[])[]) {
    fakeJsi.registerTokenizer(TOKENIZER_PATH, {
      tokens: ['prompt', '<eos>', ...pieces.map((_, i) => `piece${i}`)],
      tokenBytes: [[112], [...Buffer.from('<eos>')], ...pieces],
      specialIds: [1],
    });
    registerModelWithSchema(schema, { tokenIds: pieces.map((_, i) => i + 2) });
  }

  // cspell:disable-next-line
  it.each(['हिन्दी', 'اردو', 'ไทย', '한국어', '😀', 'żółć', '中文'])(
    'preserves split bytes in %s',
    async (reply) => {
      const bytes = [...Buffer.from(reply, 'utf8')];
      registerBytes(bytes.map((byte) => [byte]));
      const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, modalities));
      const chunks: string[] = [];

      const stats = runner.generate('prompt', { temperature: 0 }, (text) => chunks.push(text));

      expect(stats.numTokens).toBe(bytes.length);
      expect(chunks.join('')).toBe(reply);
      expect(chunks).not.toContain('');
      expect(chunks.join('')).not.toContain('\ufffd');
    }
  );

  it('buffers a complete prefix together with an incomplete tail', async () => {
    registerBytes([[65, 0xe0], [0xa4], [0x95, 66]]);
    const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, modalities));
    const chunks: string[] = [];

    runner.generate('prompt', { temperature: 0 }, (text) => chunks.push(text));

    expect(chunks).toEqual(['AकB']);
  });

  it('drops an incomplete tail at EOS', async () => {
    registerBytes([[65], [0xf0], [0x9f]]);
    const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, modalities));
    const chunks: string[] = [];

    const stats = runner.generate('prompt', { temperature: 0 }, (text) => chunks.push(text));

    expect(stats.numTokens).toBe(3);
    expect(chunks).toEqual(['A']);
  });

  it('preserves the runner special-token setting', async () => {
    registerBytes([[65]]);
    registerModelWithSchema(schema, { tokenIds: [1, 2] });
    const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, modalities));
    const chunks: string[] = [];

    runner.generate('prompt', { temperature: 0, ignoreEos: true, maxNewTokens: 2 }, (text) =>
      chunks.push(text)
    );

    expect(chunks).toEqual(_name === 'vision' ? ['', 'A'] : ['<eos>', 'A']);
  });

  it('does not carry a partial character into the next generation', async () => {
    // The first prefill samples the lead byte, then its decode step samples
    // EOS. The next prefill samples ASCII and must start with an empty buffer.
    registerBytes([[0xc3], [65]]);
    registerModelWithSchema(schema, { tokenIds: [2, 1, 3, 1] });
    const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, modalities));
    const chunks: string[] = [];

    runner.generate('prompt', { temperature: 0, maxNewTokens: 1 }, (text) => chunks.push(text));
    expect(chunks).toEqual([]);
    runner.generate('prompt', { temperature: 0 }, (text) => chunks.push(text));

    expect(chunks).toEqual(['A']);
  });
});

describe.each([
  ['text', TEXT_SPEC, []],
  ['vision', VISION_SPEC, ['image']],
  ['gemma', GEMMA_SPEC, ['image', 'audio']],
] as const)('%s runner — sampling seeds', (_name, schema, modalities) => {
  it.each([
    [42, [42, 43, 44]],
    [0xffffffff, [0xffffffff, 0, 1]],
  ] as const)(
    'advances seed %i per token without changing caller config',
    async (seed, expected) => {
      registerModelWithSchema(schema, { tokenIds: [2, 2, 2, 2, 2, 2, 2, 2] });
      const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, modalities));
      const seeds: unknown[] = [];
      const config = Object.freeze({
        seed,
        maxNewTokens: 3,
        constraints: () => {
          seeds.push(fakeSampler.lastSampleOptions()?.seed);
          return undefined;
        },
      });

      runner.generate('prompt', config);
      runner.generate('prompt', config);

      expect(seeds).toEqual([...expected, ...expected]);
      expect(config.seed).toBe(seed);
    }
  );

  it('keeps sampling unseeded when no seed is supplied', async () => {
    registerModelWithSchema(schema, { tokenIds: [2, 2, 2, 2] });
    const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, modalities));
    const seeds: unknown[] = [];

    runner.generate('prompt', {
      maxNewTokens: 3,
      constraints: () => {
        seeds.push(fakeSampler.lastSampleOptions()?.seed);
        return undefined;
      },
    });

    expect(seeds).toEqual([undefined, undefined, undefined]);
  });
});

describe.each([
  ['text', TEXT_SPEC, []],
  ['vision', VISION_SPEC, ['image']],
  ['gemma', GEMMA_SPEC, ['image', 'audio']],
] as const)('%s runner — prefill length', (_name, schema, modalities) => {
  const chunks: { length: number; pos: number }[] = [];

  beforeEach(() => {
    chunks.length = 0;
    registerModelWithSchema(schema, {
      onForward: (inputs) => {
        chunks.push({ length: inputs[0]!.shape[1]!, pos: inputs.at(-1)!.getElement(0) });
      },
    });
  });

  it('limits prefill chunks and advances positions across the final partial chunk', async () => {
    const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, modalities));

    const stats = runner.prefill('hello world hello world hello', { prefillLen: 2 });

    expect(chunks).toEqual([
      { length: 2, pos: 0 },
      { length: 2, pos: 2 },
      { length: 1, pos: 4 },
    ]);
    expect(stats.numTokens).toBe(5);
    expect(runner.getKVCacheState().pos).toBe(5);
  });

  it('defaults to the model maximum without retaining the previous override', async () => {
    const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, modalities));
    const prompt = Array(129).fill('hello').join(' ');

    runner.prefill(prompt, { prefillLen: 64 });
    expect(chunks.map((chunk) => chunk.length)).toEqual([64, 64, 1]);
    chunks.length = 0;
    runner.prefill(prompt);

    expect(chunks).toEqual([
      { length: 128, pos: 129 },
      { length: 1, pos: 257 },
    ]);
  });

  it('forwards the generation config to prefill and keeps decode steps at one token', async () => {
    const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, modalities));

    const stats = runner.generate('hello world hello world hello', {
      prefillLen: 2,
      maxNewTokens: 2,
    });

    expect(chunks.map((chunk) => chunk.length)).toEqual([2, 2, 1, 1, 1]);
    expect(stats.prefill.numTokens).toBe(5);
    expect(stats.numTokens).toBe(2);
    expect(runner.getKVCacheState().pos).toBe(7);
  });

  it.each([0, -1, 1.5, 129, Infinity, NaN])(
    'rejects invalid prefillLen %s before inference',
    async (prefillLen) => {
      const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, modalities));

      expect(() => runner.prefill('hello', { prefillLen })).toThrow(
        expect.objectContaining({ code: 'INVALID_ARGUMENT' })
      );
      expect(() => runner.generate('hello', { prefillLen })).toThrow(
        expect.objectContaining({ code: 'INVALID_ARGUMENT' })
      );
      expect(chunks).toEqual([]);
      expect(runner.getKVCacheState().pos).toBe(0);
    }
  );

  if (_name !== 'text') {
    it('uses the requested length for interleaved text and image embeddings', async () => {
      const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, modalities));
      const image = tracked(tensor('float32', [1, 3, 32, 32]));

      const stats = runner.prefill(['hello world hello', { kind: 'image', image }], {
        prefillLen: 2,
      });

      expect(chunks).toEqual([
        { length: 2, pos: 0 },
        { length: 1, pos: 2 },
        { length: 2, pos: 3 },
        { length: 2, pos: 5 },
      ]);
      expect(stats.numTokens).toBe(7);
      expect(runner.getKVCacheState().pos).toBe(7);
    });
  }

  if (_name === 'gemma') {
    it('chunks valid audio embeddings using the requested length', async () => {
      const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, modalities));
      const audio = tracked(tensor('float32', [1, 6000]));

      const stats = runner.prefill([{ kind: 'audio', audio }], { prefillLen: 2 });

      expect(chunks.map((chunk) => chunk.length)).toEqual([2, 2, 2, 2, 2, 2]);
      expect(chunks.map((chunk) => chunk.pos)).toEqual([0, 2, 4, 6, 8, 10]);
      expect(stats.numTokens).toBe(12);
      expect(runner.getKVCacheState().pos).toBe(12);
    });
  }
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

  it('dispatches to vision multimodal runner when schema matches LLM_VISION_SPEC', async () => {
    registerModelWithSchema(VISION_SPEC);
    const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, ['image']));
    expect(runner).toBeDefined();
    expect(runner.modalities).toEqual(['image']);
  });

  it('rejects vision multimodal runner if image modality is missing', async () => {
    registerModelWithSchema(VISION_SPEC);
    await expect(createLLMRunner(MODEL_PATH, TOKENIZER_PATH)).rejects.toThrow(
      /Multimodal model requires \[image\] modalities/
    );
  });

  it('dispatches to audio multimodal runner when schema matches LLM_AUDIO_SPEC', async () => {
    registerModelWithSchema(AUDIO_SPEC);
    const runner = tracked(await createLLMRunner(MODEL_PATH, TOKENIZER_PATH, ['audio']));
    expect(runner.modalities).toEqual(['audio']);
  });

  it('rejects audio multimodal runner if audio modality is missing', async () => {
    registerModelWithSchema(AUDIO_SPEC);
    await expect(createLLMRunner(MODEL_PATH, TOKENIZER_PATH, ['image'])).rejects.toThrow(
      /Multimodal model requires \[audio\] modalities/
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
    registerModelWithSchema(VISION_SPEC, { maxContextLen: 256 });
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
    // Each piece is decoded after the previous one, so the pieces add up to
    // the decode of the whole sequence (this vocabulary joins words with spaces).
    expect(tokens).toEqual(['hello', ' hello', ' hello']);
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

describe('createLLMGemmaRunner — execution & multimodal prefill', () => {
  beforeEach(() => {
    registerModelWithSchema(GEMMA_SPEC, { maxContextLen: 512 });
  });

  it('prefills text and updates KV cache position', async () => {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMGemmaRunner(model, tokenizer, ['image', 'audio']));

    expect(runner.getKVCacheState()).toEqual({
      pos: 0,
      maxContextLen: 512,
      remainingTokens: 512,
      usageRatio: 0,
    });

    const stats = runner.prefill('hello world');
    expect(stats.numTokens).toBe(2);
    expect(runner.getKVCacheState().pos).toBe(2);
    expect(runner.getKVCacheState().remainingTokens).toBe(510);
  });

  it('prefills image and updates KV cache position by visual tokens count', async () => {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMGemmaRunner(model, tokenizer, ['image', 'audio']));

    const img = tensor('float32', [1, 3, 32, 32]);
    try {
      const stats = runner.prefill([{ kind: 'image', image: img }]);
      expect(stats.numTokens).toBe(4); // visualTokens = 4
      expect(runner.getKVCacheState().pos).toBe(4);
    } finally {
      img.dispose();
    }
  });

  it('prefills audio and chunks properly into block tokens', async () => {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMGemmaRunner(model, tokenizer, ['image', 'audio']));

    // 7680 samples = 1 block = 12 tokens
    const wav = tensor('float32', [1, 7680]);
    try {
      const stats = runner.prefill([{ kind: 'audio', audio: wav }]);
      expect(stats.numTokens).toBe(12);
      expect(runner.getKVCacheState().pos).toBe(12);
    } finally {
      wav.dispose();
    }
  });

  it('drops padded tail tokens when audio_encoder mask indicates partial validity', async () => {
    // Custom execute that returns 7 valid tokens and 5 padded tokens in the audio mask
    fakeJsi.registerModel(MODEL_PATH, {
      schema: GEMMA_SPEC,
      execute: (methodName, _inputs, outputs) => {
        switch (methodName) {
          case 'get_max_seq_len':
            return [128];
          case 'get_max_context_len':
            return [512];
          case 'get_vocab_size':
            return [100];
          case 'use_kv_cache':
          case 'enable_dynamic_shape':
            return [true];
          case 'get_eos_ids':
            return [1];
          case 'audio_encoder': {
            const mask = outputs[1];
            if (mask) {
              for (let i = 0; i < 7; i++) mask.setElement(i, 1);
              for (let i = 7; i < mask.numel; i++) mask.setElement(i, 0);
            }
            return undefined;
          }
          default:
            return undefined;
        }
      },
    });

    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMGemmaRunner(model, tokenizer, ['image', 'audio']));

    const wav = tensor('float32', [1, 7680]);
    try {
      const stats = runner.prefill([{ kind: 'audio', audio: wav }]);
      // 7 valid tokens, 5 padded tokens dropped
      expect(stats.numTokens).toBe(7);
      expect(runner.getKVCacheState().pos).toBe(7);
    } finally {
      wav.dispose();
      registerModelWithSchema(GEMMA_SPEC);
    }
  });

  it('evaluates pad token PLE once at load and uses it for media prefill', async () => {
    let capturedDecoderPle: number[] = [];
    fakeJsi.registerModel(MODEL_PATH, {
      schema: GEMMA_SPEC,
      execute: (methodName, inputs, outputs) => {
        switch (methodName) {
          case 'get_max_seq_len':
            return [128];
          case 'get_max_context_len':
            return [512];
          case 'get_vocab_size':
            return [100];
          case 'use_kv_cache':
          case 'enable_dynamic_shape':
            return [true];
          case 'get_eos_ids':
            return [1];
          case 'token_embedding': {
            const ple = outputs[1];
            if (ple) {
              // Mark pad token PLE with distinct marker values (42.0)
              for (let i = 0; i < ple.numel; i++) ple.setElement(i, 42);
            }
            return undefined;
          }
          case 'text_decoder': {
            const pleInput = inputs[1] as any;
            if (pleInput && pleInput.numel > 0) {
              capturedDecoderPle = [...pleInput.getData(new Float32Array(pleInput.numel))];
            }
            return undefined;
          }
          default:
            return undefined;
        }
      },
    });

    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMGemmaRunner(model, tokenizer, ['image', 'audio']));

    const img = tensor('float32', [1, 3, 32, 32]);
    try {
      runner.prefill([{ kind: 'image', image: img }]);
      expect(capturedDecoderPle.length).toBeGreaterThan(0);
      // All values passed to text_decoder PLE should match pad token's marker (42)
      expect(capturedDecoderPle.every((v) => v === 42)).toBe(true);
    } finally {
      img.dispose();
      registerModelWithSchema(GEMMA_SPEC);
    }
  });

  it('rejects invalid audio tensor dtype or empty audio', async () => {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMGemmaRunner(model, tokenizer, ['image', 'audio']));

    const badDtypeWav = tensor('int32', [1, 7680]);
    try {
      expect(() => runner.prefill([{ kind: 'audio', audio: badDtypeWav }])).toThrow(
        /Expected audio tensor of dtype 'float32'/
      );
    } finally {
      badDtypeWav.dispose();
    }

    const emptyWav = {
      dtype: 'float32',
      shape: [0],
      numel: 0,
    } as any;
    expect(() => runner.prefill([{ kind: 'audio', audio: emptyWav }])).toThrow(
      /Audio waveform is empty/
    );
  });

  it('handles interleaved text, image, and audio prompts', async () => {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMGemmaRunner(model, tokenizer, ['image', 'audio']));

    const img = tensor('float32', [1, 3, 32, 32]);
    const wav = tensor('float32', [1, 7680]);
    try {
      const stats = runner.prefill([
        'describe this:',
        { kind: 'image', image: img },
        'and listen:',
        { kind: 'audio', audio: wav },
      ]);
      // 2 text + 4 image + 2 text + 12 audio = 20 tokens
      expect(stats.numTokens).toBe(2 + 4 + 2 + 12);
      expect(runner.getKVCacheState().pos).toBe(20);
    } finally {
      img.dispose();
      wav.dispose();
    }
  });

  it('generates tokens and triggers onToken callback', async () => {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMGemmaRunner(model, tokenizer, ['image', 'audio']));

    const tokens: string[] = [];
    const stats = runner.generate('hello', { maxNewTokens: 3 }, (tok) => tokens.push(tok));

    expect(stats.numTokens).toBe(3);
    expect(tokens.length).toBe(3);
    // Each piece is decoded after the previous one, so the pieces add up to
    // the decode of the whole sequence (this vocabulary joins words with spaces).
    expect(tokens).toEqual(['hello', ' hello', ' hello']);
  });

  it('resets KV cache and disposes cleanly', async () => {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = createLLMGemmaRunner(model, tokenizer, ['image', 'audio']);

    runner.prefill('hello world');
    expect(runner.getKVCacheState().pos).toBe(2);

    runner.reset(1);
    expect(runner.getKVCacheState().pos).toBe(1);
    runner.reset();
    expect(runner.getKVCacheState().pos).toBe(0);

    runner.dispose();
    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.liveTokenizers()).toEqual([]);
  });
});

describe('createLLMMultimodalRunner — audio input', () => {
  const encoderLengths: number[] = [];
  beforeEach(() => {
    encoderLengths.length = 0;
    registerModelWithSchema(AUDIO_SPEC, {
      onAudioEncode: (inputs) => encoderLengths.push(inputs[0]!.shape[1]!),
    });
  });

  async function prefillAudio(numSamples: number) {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMMultimodalRunner(model, tokenizer, ['audio']));
    const wav = tensor('float32', [1, numSamples]);
    try {
      return { stats: runner.prefill([{ kind: 'audio', audio: wav }]), runner };
    } finally {
      wav.dispose();
    }
  }

  it('right-pads a clip to the next hop and prefills ceil(frames / 8) tokens', async () => {
    // 1000 samples -> 400 + 4 * 160 = 1040 -> 5 frames -> 1 token.
    const { stats, runner } = await prefillAudio(1000);
    expect(encoderLengths).toEqual([1040]);
    expect(stats.numTokens).toBe(1);
    expect(runner.getKVCacheState().pos).toBe(1);
  });

  it('encodes a clip longer than the encoder accepts in hop-aligned chunks', async () => {
    // Chunks of 3600 - 400 + 160 = 3360 samples: 3360 -> 3440 (20 frames, 3 tokens),
    // then 1640 -> 1680 (9 frames, 2 tokens).
    const { stats } = await prefillAudio(5000);
    expect(encoderLengths).toEqual([3440, 1680]);
    expect(stats.numTokens).toBe(5);
  });

  it('rejects an image on an audio model', async () => {
    const model = await loadModel(MODEL_PATH);
    const tokenizer = await loadTokenizer(TOKENIZER_PATH);
    const runner = tracked(createLLMMultimodalRunner(model, tokenizer, ['audio']));
    const img = tensor('float32', [1, 3, 32, 32]);
    try {
      expect(() => runner.prefill([{ kind: 'image', image: img }])).toThrow();
    } finally {
      img.dispose();
    }
  });
});
