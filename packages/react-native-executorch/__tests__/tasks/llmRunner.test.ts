import { constraint, f32, i64, method, RangeDim } from '../../src/core/schema';
import { tensor } from '../../src/core/tensor';
import { createLLMRunner } from '../../src/extensions/llm/llmRunner';
import { createLLMMultimodalRunner } from '../../src/extensions/llm/runners/llmMultimodalRunner';
import { createLLMGemmaRunner } from '../../src/extensions/llm/runners/llmGemmaRunner';
import { loadModel } from '../../src/core/model';
import { loadTokenizer } from '../../src/extensions/nlp';
import { fakeJsi } from '../support/fakeJsi';
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
  options: { maxContextLen?: number; tokenIds?: readonly number[] } = {}
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
        case 'forward':
        case 'text_decoder': {
          const out = outputs[0];
          if (out && (options.tokenIds || methodName === 'text_decoder')) {
            for (let i = 0; i < out.numel; i++) out.setElement(i, 0);
            out.setElement(options.tokenIds ? (options.tokenIds[step++] ?? 1) : 2, 10);
          }
          return undefined;
        }
        case 'audio_encoder': {
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
  ['multimodal', MULTIMODAL_SPEC, ['image']],
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

    expect(chunks).toEqual(_name === 'multimodal' ? ['', 'A'] : ['<eos>', 'A']);
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
  ['multimodal', MULTIMODAL_SPEC, ['image']],
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
    expect(tokens).toEqual(['hello', 'hello', 'hello']);
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
