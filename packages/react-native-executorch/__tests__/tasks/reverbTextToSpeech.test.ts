/**
 * The Reverb pipeline on the fake runtime: the programs' contract, the calls
 * and shapes that make a chunk, the sampler, chunking, validation, the lazy
 * encoder, and disposal. The speech itself needs real weights.
 */
import { RangeDim, constraint, f16, f32, i64, method } from '../../src/core/schema';
import {
  REVERB_SAMPLE_RATE,
  createReverbTextToSpeech,
  type ReverbVoice,
} from '../../src/extensions/speech/tasks/reverbTextToSpeech';
import {
  estimateTargetFrames,
  prepareText,
  roundHalfEven,
} from '../../src/extensions/speech/utils/reverbUtils';
import { fakeJsi } from '../support/fakeJsi';
import { fakeFs } from '../support/blobUtilMock';
import { exported } from '../support/fixtures';
import { tracked } from '../support/lifetime';
import type { FakeTensor } from '../support/fakeTensor';

const BACKBONE_PATH = '/models/echo_mlx_fp16.pte';
const DECODER_PATH = '/models/codec_decoder_coreml_fp16.pte';
const ENCODER_PATH = '/models/codec_encoder_coreml_int4.pte';
const TOKENIZER_PATH = '/models/tokenizer.json';
const VOICE_PATH = '/models/voices/anna.json';

const FRAME_SAMPLES = 960;
const MAX_PROMPT = 64; // tokens; the fake tokenizer makes one per whitespace-separated piece
const PREDICTED = 5; // every step predicts this code
const POLISHED = 9; // polish fills codebooks 2-7 with this code
const ENCODED = 17; // the encoder's codes

const frames = (min: number, max: number) => RangeDim(min, max);
const tDim = (paramSide: 'input' | 'output', tensorIdx: number, dimIdx = 1) => ({
  paramSide,
  tensorIdx,
  dimIdx,
});

const backboneSchema = (cacheType = f16) => {
  const cache = () => cacheType(2, 24, 6, frames(4, 1024), 128);
  return exported({
    ...method('prefill', [i64(frames(2, MAX_PROMPT)), i64(8, frames(2, 512))], [cache()]),
    ...method(
      'step',
      [i64(8, frames(4, 1024)), cache()],
      [f32(2, frames(4, 1024)), i64(2, frames(4, 1024)), f32(2, frames(4, 1024))],
      [
        constraint.equality(
          tDim('input', 0),
          tDim('output', 0),
          tDim('output', 1),
          tDim('output', 2)
        ),
      ]
    ),
    ...method(
      'polish',
      [i64(8, frames(4, 1024)), i64(1), cache()],
      [i64(6, frames(4, 1024))],
      [constraint.equality(tDim('input', 0), tDim('output', 0))]
    ),
  });
};

const decoderSchema = (withConstraint = true) =>
  exported(
    method(
      'forward',
      [i64(8, frames(4, 1024))],
      [f32(RangeDim(4 * FRAME_SAMPLES, 1024 * FRAME_SAMPLES, FRAME_SAMPLES))],
      withConstraint
        ? [constraint.linear(tDim('output', 0, 0), tDim('input', 0), FRAME_SAMPLES)]
        : []
    )
  );

const encoderSchema = (width = FRAME_SAMPLES) =>
  exported(
    method(
      'forward',
      [f32(frames(25, 500), width)],
      [i64(8, frames(25, 500))],
      [constraint.equality(tDim('input', 0, 0), tDim('output', 0))]
    )
  );

const fill = (t: FakeTensor, value: number) => {
  for (let i = 0; i < t.numel; i++) t.setElement(i, value);
};

/** Every call's method, input shapes, and inputs. */
let calls: { methodName: string; shapes: (readonly number[])[]; inputs: FakeTensor[] }[] = [];
/** Masked slots of codebooks 0-1 entering each step and the polish. */
let masked: number[] = [];

const registerModels = (backbone = backboneSchema(), decoder = decoderSchema()): void => {
  calls = [];
  masked = [];
  const record = (methodName: string, inputs: readonly unknown[]) => {
    const tensors = inputs as FakeTensor[];
    calls.push({ methodName, shapes: tensors.map((t) => t.shape), inputs: tensors });
  };
  fakeJsi.registerModel(BACKBONE_PATH, {
    schema: backbone,
    execute: (methodName, inputs, outputs) => {
      record(methodName, inputs);
      const tokens = inputs[0] as FakeTensor;
      if (methodName !== 'prefill') {
        const slots = Array.from({ length: 2 * tokens.shape[1]! }, (_, i) => tokens.getElement(i));
        masked.push(slots.filter((code) => code === 1024).length);
      }
      if (methodName === 'step') {
        fill(outputs[0]!, -1);
        fill(outputs[1]!, PREDICTED);
        outputs[2]!.data.forEach((_, i) => outputs[2]!.setElement(i, -i));
      }
      if (methodName === 'polish') fill(outputs[0]!, POLISHED);
    },
  });
  fakeJsi.registerModel(DECODER_PATH, {
    schema: decoder,
    execute: (methodName, inputs, outputs) => {
      record(`decoder.${methodName}`, inputs);
      fill(outputs[0]!, 0.5); // a steady tone: nothing for the trim to cut
    },
  });
  fakeJsi.registerModel(ENCODER_PATH, {
    schema: encoderSchema(),
    execute: (methodName, inputs, outputs) => {
      record(`encoder.${methodName}`, inputs);
      fill(outputs[0]!, ENCODED);
    },
  });
  fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: [], open: true });
};

const PRESET = {
  codes: new Array(8 * 30).fill(3),
  transcript: 'This is my voice.',
  language: 'en',
};
const preset: ReverbVoice = {
  codes: BigInt64Array.from(PRESET.codes, BigInt),
  transcript: PRESET.transcript,
  language: 'en',
};

const config = {
  name: 'reverb',
  modelPaths: { backbone: BACKBONE_PATH, codecDecoder: DECODER_PATH, codecEncoder: ENCODER_PATH },
  tokenizerPath: TOKENIZER_PATH,
  voices: { anna: VOICE_PATH },
} as const;

const collect = async <T>(stream: AsyncGenerator<T>): Promise<T[]> => {
  const chunks: T[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return chunks;
};

const methodsCalled = () => calls.map(({ methodName }) => methodName);

beforeEach(() => {
  fakeFs.write(VOICE_PATH, JSON.stringify(PRESET));
  registerModels();
});

describe('createReverbTextToSpeech — the model contract', () => {
  it('accepts the exported programs and exposes the synthesis API', async () => {
    const tts = tracked(await createReverbTextToSpeech(config));

    expect(tts.encodeVoice).toBeInstanceOf(Function);
    expect(tts.synthesize).toBeInstanceOf(Function);
    expect(tts.synthesizeStop).toBeInstanceOf(Function);
  });

  it('rejects a backbone whose cache is not float16', async () => {
    registerModels(backboneSchema(f32));

    await expect(createReverbTextToSpeech(config)).rejects.toThrow(/DType mismatch/);
  });

  it('rejects a decoder that does not tie its audio length to the frames', async () => {
    registerModels(backboneSchema(), decoderSchema(false));

    await expect(createReverbTextToSpeech(config)).rejects.toThrow(/constraint/i);
  });

  it('rejects a malformed preset voice', async () => {
    fakeFs.write(VOICE_PATH, JSON.stringify({ ...PRESET, codes: [1, 2, 3] }));
    await expect(createReverbTextToSpeech(config)).rejects.toThrow(/Voice 'anna': A voice holds/);

    fakeFs.write(VOICE_PATH, JSON.stringify({ ...PRESET, language: 'xx' }));
    await expect(createReverbTextToSpeech(config)).rejects.toThrow(/Voice 'anna': A voice holds/);
  });

  it('releases the programs, the tokenizer and every tensor when construction fails', async () => {
    registerModels(backboneSchema(), decoderSchema(false));

    await expect(createReverbTextToSpeech(config)).rejects.toThrow();

    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.liveTokenizers()).toEqual([]);
    expect(fakeJsi.liveTensors()).toBe(0);
  });

  it('loads the encoder only when a voice is first encoded', async () => {
    const tts = tracked(await createReverbTextToSpeech(config));
    expect(fakeJsi.liveModels()).toEqual([BACKBONE_PATH, DECODER_PATH].sort());

    await tts.encodeVoice(new Float32Array(2 * REVERB_SAMPLE_RATE), 'Hello there.', 'en');

    expect(fakeJsi.liveModels()).toEqual([BACKBONE_PATH, DECODER_PATH, ENCODER_PATH].sort());
  });

  it('releases every program, the tokenizer and the tensors on dispose', async () => {
    const tts = await createReverbTextToSpeech(config);
    await tts.encodeVoice(new Float32Array(2 * REVERB_SAMPLE_RATE), 'Hello there.', 'en');

    tts.dispose();

    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.liveTokenizers()).toEqual([]);
    expect(fakeJsi.liveTensors()).toBe(0);
  });
});

describe('createReverbTextToSpeech — synthesis', () => {
  const TEXT = 'Hello world, this is a test.';
  const estimate = (text: string) =>
    estimateTargetFrames(prepareText(text, 'en'), PRESET.transcript, 30);
  const targetFrames = (text: string) => Math.max(10, estimate(text));

  it('makes a chunk from a prefill, 8 steps, the polish and the decoder, in that order', async () => {
    const tts = tracked(await createReverbTextToSpeech(config));

    await collect(tts.synthesize(TEXT, { voice: 'anna', language: 'en' }));

    expect(methodsCalled()).toEqual([
      'prefill',
      ...new Array(8).fill('step'),
      'polish',
      'decoder.forward',
    ]);
  });

  it('sizes every tensor from the prompt, the voice and the estimated length', async () => {
    const tts = tracked(await createReverbTextToSpeech(config));

    await collect(tts.synthesize(TEXT, { voice: 'anna', language: 'en' }));

    const [prefill, step] = calls;
    const polish = calls.find(({ methodName }) => methodName === 'polish')!;
    const decode = calls.find(({ methodName }) => methodName === 'decoder.forward')!;
    const promptTokens = prefill!.shapes[0]![0]!;
    const target = targetFrames(TEXT);
    expect(prefill!.shapes[1]).toEqual([8, 30]);
    expect(step!.shapes).toEqual([
      [8, target],
      [2, 24, 6, promptTokens + 30, 128],
    ]);
    expect(polish.inputs[1]!.getElement(0)).toBe(30);
    expect(decode.shapes).toEqual([[8, target]]);
  });

  it('decodes the committed codes of codebooks 0-1 and the polished codebooks 2-7', async () => {
    const tts = tracked(await createReverbTextToSpeech(config));

    await collect(tts.synthesize(TEXT, { voice: 'anna', language: 'en' }));

    const codes = calls.find(({ methodName }) => methodName === 'decoder.forward')!.inputs[0]!;
    const target = targetFrames(TEXT);
    const rows = Array.from(
      { length: 8 },
      (_, row) =>
        new Set(Array.from({ length: target }, (__, i) => codes.getElement(row * target + i)))
    );
    expect(rows.map((values) => [...values])).toEqual([
      [PREDICTED],
      [PREDICTED],
      ...new Array(6).fill([POLISHED]),
    ]);
  });

  it('cuts 0.2 s off the end and appends the pause its punctuation calls for', async () => {
    const tts = tracked(await createReverbTextToSpeech(config));

    const [chunk] = await collect(tts.synthesize(TEXT, { voice: 'anna', language: 'en' }));

    const pause = 0.375 * REVERB_SAMPLE_RATE; // after '.'
    expect(chunk!.audio.length).toBe(targetFrames(TEXT) * FRAME_SAMPLES - 4800 + pause);
    expect(chunk).toMatchObject({ sampleRate: REVERB_SAMPLE_RATE, chunkIndex: 0, totalChunks: 1 });
    expect(chunk!.duration).toBeCloseTo(chunk!.audio.length / REVERB_SAMPLE_RATE);
  });

  it('returns the raw decoder output, plus the pause, without post-processing', async () => {
    const tts = tracked(await createReverbTextToSpeech(config));

    const [chunk] = await collect(
      tts.synthesize('No mark here', { voice: 'anna', language: 'en', postprocess: false })
    );

    expect(chunk!.audio.length).toBe(targetFrames('No mark here') * FRAME_SAMPLES);
  });

  it('runs as many main passes as asked', async () => {
    const tts = tracked(await createReverbTextToSpeech(config));

    await collect(tts.synthesize(TEXT, { voice: 'anna', language: 'en', sampling: { steps: 3 } }));

    expect(methodsCalled().filter((name) => name === 'step')).toHaveLength(3);
  });

  it('stretches the target as the speed drops', async () => {
    const tts = tracked(await createReverbTextToSpeech(config));

    await collect(tts.synthesize(TEXT, { voice: 'anna', language: 'en', speed: 0.8 }));

    expect(calls[1]!.shapes[0]).toEqual([8, roundHalfEven(estimate(TEXT) / 0.8)]);
  });

  it('prompts with the language, the voice transcript and the prepared text', async () => {
    const vocabulary: string[] = [];
    fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: vocabulary, open: true });
    const tts = tracked(await createReverbTextToSpeech(config));

    await collect(tts.synthesize('I have 2 cats.', { voice: 'anna', language: 'en' }));

    const ids = calls[0]!.inputs[0]!;
    const words = Array.from({ length: ids.numel }, (_, i) => vocabulary[ids.getElement(i)]);
    expect(words.join(' ')).toBe(
      '<|denoise|><|lang_start|>en<|lang_end|><|instruct_start|>None<|instruct_end|>' +
        '<|text_start|>This is my voice. I have two cats.<|text_end|>'
    );
  });

  it("commits and re-masks codebooks 0-1 on Voice Studio's schedule", async () => {
    const tts = tracked(await createReverbTextToSpeech(config));

    await collect(tts.synthesize(TEXT, { voice: 'anna', language: 'en' }));

    // 8 passes: each commits its share of the slots, then all but the last
    // re-mask a quarter as many held codes. The polish gets none masked.
    const slots = 2 * targetFrames(TEXT);
    const share = (i: number) => (0.1 * (i / 8)) / (1 - (1 - 0.1) * (i / 8));
    const expected = [slots];
    for (let pass = 0; pass < 8; pass++) {
      const open = expected[pass]!;
      const last = pass === 7;
      const commits = last
        ? open
        : Math.min(open, Math.ceil(slots * (share(pass + 1) - share(pass))));
      const withdrawn = last ? 0 : Math.min(roundHalfEven(0.25 * commits), slots - open);
      expected.push(open - commits + withdrawn);
    }
    expect(masked).toEqual(expected);
    expect(masked.at(-1)).toBe(0);
  });

  it('speaks a text too long for one chunk in several, each from its own prefill', async () => {
    const tts = tracked(await createReverbTextToSpeech(config));
    const text = 'First sentence here. Second sentence follows it. Third one ends the text.';

    const chunks = await collect(
      tts.synthesize(text, { voice: 'anna', language: 'en', maxChunkDuration: 1.5 })
    );

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map(({ chunkIndex }) => chunkIndex)).toEqual(chunks.map((_, i) => i));
    expect(new Set(chunks.map(({ totalChunks }) => totalChunks))).toEqual(new Set([chunks.length]));
    expect(methodsCalled().filter((name) => name === 'prefill')).toHaveLength(chunks.length);
  });

  it('keeps every prompt within the backbone token limit', async () => {
    const tts = tracked(await createReverbTextToSpeech(config));
    const text = new Array(150).fill('word').join(' ') + '.';

    await collect(tts.synthesize(text, { voice: 'anna', language: 'en' }));

    const prompts = calls.filter(({ methodName }) => methodName === 'prefill');
    expect(prompts.length).toBeGreaterThan(1);
    for (const { shapes } of prompts) expect(shapes[0]![0]).toBeLessThanOrEqual(MAX_PROMPT);
  });

  it('synthesizes in a voice it encoded', async () => {
    const tts = tracked(await createReverbTextToSpeech(config));
    const audio = new Float32Array(Math.round(2.5 * REVERB_SAMPLE_RATE));

    const voice = await tts.encodeVoice(audio, 'I have 2 cats.', 'en');
    await collect(tts.synthesize(TEXT, { voice, language: 'en' }));

    expect(voice.transcript).toBe('I have two cats.');
    expect(voice.codes).toEqual(new BigInt64Array(8 * 62).fill(BigInt(ENCODED)));
    expect(calls.find(({ methodName }) => methodName === 'encoder.forward')!.shapes).toEqual([
      [62, FRAME_SAMPLES],
    ]);
    expect(calls.find(({ methodName }) => methodName === 'prefill')!.shapes[1]).toEqual([8, 62]);
  });

  it('stops streaming when synthesizeStop is called mid-stream', async () => {
    const tts = tracked(await createReverbTextToSpeech(config));
    const text = 'First sentence here. Second sentence follows it. Third one ends the text.';

    const stream = tts.synthesize(text, { voice: 'anna', language: 'en', maxChunkDuration: 1.5 });
    const first = await stream.next();
    tts.synthesizeStop();
    const after = await stream.next();

    expect(first.value!.totalChunks).toBeGreaterThan(1);
    expect(after.done).toBe(true);
  });

  it('leaves no tensor behind once a stream is drained or abandoned', async () => {
    const tts = tracked(await createReverbTextToSpeech(config));
    const text = 'First sentence here. Second sentence follows it.';

    await collect(tts.synthesize(text, { voice: 'anna', language: 'en', maxChunkDuration: 1.5 }));
    const stream = tts.synthesize(text, { voice: 'anna', language: 'en', maxChunkDuration: 1.5 });
    await stream.next();
    await stream.return(undefined as never);

    expect(fakeJsi.liveTensors()).toBe(0);
  });
});

describe('createReverbTextToSpeech — argument validation', () => {
  const synthesizeWith = async (options: object, text = 'Hello.') => {
    const tts = tracked(await createReverbTextToSpeech(config));
    return collect(tts.synthesize(text, { voice: 'anna', language: 'en', ...options } as never));
  };

  it.each([
    ['an empty text', {}, '', /cannot be empty/],
    ['an unsupported language', { language: 'xx' }, 'Hello.', /Unsupported language/],
    ['an unknown voice', { voice: 'nobody' }, 'Hello.', /Unknown voice/],
    ['a speed that is too slow', { speed: 0.4 }, 'Hello.', /speed must be between/],
    ['a speed that is too fast', { speed: 2.1 }, 'Hello.', /speed must be between/],
    ['a chunk longer than the target window', { maxChunkDuration: 60 }, 'Hello.', /at most 40.96/],
    ['a fractional step count', { sampling: { steps: 2.5 } }, 'Hello.', /positive integer/],
    ['a remask ratio above 1', { sampling: { remaskRatio: 1.5 } }, 'Hello.', /\[0, 1\]/],
    ['a fractional seed', { sampling: { seed: 0.5 } }, 'Hello.', /seed must be an integer/],
  ])('rejects %s', async (_label, options, text, error) => {
    await expect(synthesizeWith(options, text)).rejects.toThrow(error);
  });

  it.each([
    ['codes not in rows of 8', { ...preset, codes: new BigInt64Array(9) }],
    ['a reference shorter than 2 frames', { ...preset, codes: new BigInt64Array(8) }],
    ['a code out of range', { ...preset, codes: new BigInt64Array(16).fill(1024n) }],
    ['no transcript', { ...preset, transcript: ' ' }],
  ])('rejects a voice with %s', async (_label, voice) => {
    await expect(synthesizeWith({ voice })).rejects.toThrow(/A voice holds/);
  });

  it('rejects a voice whose transcript fills the prompt', async () => {
    const voice = { ...preset, transcript: new Array(MAX_PROMPT).fill('word').join(' ') };

    await expect(synthesizeWith({ voice })).rejects.toThrow(/leaves no room/);
  });

  it('refuses a second synthesis while one is still running, then runs it afterwards', async () => {
    const tts = tracked(await createReverbTextToSpeech(config));
    const first = tts.synthesize('One. Two. Three.', { voice: 'anna', language: 'en' });
    await first.next();

    await expect(
      collect(tts.synthesize('Again.', { voice: 'anna', language: 'en' }))
    ).rejects.toThrow(/already in progress/);
    await collect(first);
    await expect(
      collect(tts.synthesize('Again.', { voice: 'anna', language: 'en' }))
    ).resolves.toHaveLength(1);
  });

  it.each([
    ['shorter than 1 s', 0.9],
    ['longer than 20 s', 20.5],
  ])('rejects a recording %s', async (_label, seconds) => {
    const tts = tracked(await createReverbTextToSpeech(config));
    const audio = new Float32Array(Math.round(seconds * REVERB_SAMPLE_RATE));

    await expect(tts.encodeVoice(audio, 'Hello.', 'en')).rejects.toThrow(/must last 1 to 20 s/);
  });

  it('rejects encoding without a transcript or in an unsupported language', async () => {
    const tts = tracked(await createReverbTextToSpeech(config));
    const audio = new Float32Array(2 * REVERB_SAMPLE_RATE);

    await expect(tts.encodeVoice(audio, '  ', 'en')).rejects.toThrow(/transcript cannot be empty/);
    await expect(tts.encodeVoice(audio, 'Hi.', 'xx' as never)).rejects.toThrow(/Unsupported/);
  });

  it('refuses to encode when the config names no encoder', async () => {
    const modelPaths = { backbone: BACKBONE_PATH, codecDecoder: DECODER_PATH };
    const tts = tracked(await createReverbTextToSpeech({ ...config, modelPaths }));

    await expect(
      tts.encodeVoice(new Float32Array(2 * REVERB_SAMPLE_RATE), 'Hello.', 'en')
    ).rejects.toThrow(/names no codecEncoder/);
  });

  it('rejects an encoder with the wrong frame width, and releases it', async () => {
    fakeJsi.registerModel(ENCODER_PATH, { schema: encoderSchema(480) });
    const tts = tracked(await createReverbTextToSpeech(config));

    await expect(
      tts.encodeVoice(new Float32Array(2 * REVERB_SAMPLE_RATE), 'Hello.', 'en')
    ).rejects.toThrow(/Constant dimension mismatch/);
    expect(fakeJsi.liveModels()).not.toContain(ENCODER_PATH);
  });
});
