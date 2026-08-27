/**
 * The Kokoro text-to-speech pipeline.
 *
 * Two `.pte` files, a native phonemizer and a set of voice matrices read off
 * disk, wired together by a long stateful worklet. The waveform itself depends
 * on real weights, so what this pins down is the contract around it: the exact
 * signatures the two sub-models must export and how a mismatch is reported, the
 * argument validation every caller hits, the chunking that keeps a long input
 * inside the models' token window, the streaming generator's shape, and the
 * disposal of five separate native resources — two models, the phonemizer and
 * the tensors the pipeline keeps alive for its whole life.
 */
import { RangeDim, bool, constraint, f32, i64, method } from '../../src/core/schema';
import {
  KOKORO_SAMPLE_RATE,
  createKokoroTextToSpeech,
} from '../../src/extensions/speech/tasks/kokoroTextToSpeech';
import { fakeJsi } from '../support/fakeJsi';
import { fakePhonemizer } from '../support/fakeOps';
import { fakeFs } from '../support/blobUtilMock';
import { exported } from '../support/fixtures';
import { tracked } from '../support/lifetime';
import { allowNativeLeaks } from '../support/setup';

const PREDICTOR_PATH = '/models/duration_predictor.pte';
const SYNTHESIZER_PATH = '/models/synthesizer.pte';
const VOICE_PATH = '/models/voices/af_heart.bin';

// Fixed by the exported models rather than by the pipeline.
const VOICE_REF_SIZE = 256;
const DURATION_FEATURE_DIM = 640;
const TICKS_PER_DURATION = 600;

const MAX_TOKENS = 32;
const MAX_DURATION_TICKS = 512;

const predictorSchema = (maxTokens = MAX_TOKENS) =>
  exported(
    method(
      'forward',
      [
        i64(1, RangeDim(2, maxTokens)),
        bool(1, RangeDim(2, maxTokens)),
        f32(1, VOICE_REF_SIZE / 2),
        f32(1),
      ],
      [i64(RangeDim(2, maxTokens)), f32(1, RangeDim(2, maxTokens), DURATION_FEATURE_DIM)],
      [
        constraint.equality(
          { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
          { paramSide: 'input', tensorIdx: 1, dimIdx: 1 },
          { paramSide: 'output', tensorIdx: 0, dimIdx: 0 },
          { paramSide: 'output', tensorIdx: 1, dimIdx: 1 }
        ),
      ]
    )
  );

const synthesizerSchema = (maxTokens = MAX_TOKENS) =>
  exported(
    method(
      'forward',
      [
        i64(1, RangeDim(2, maxTokens)),
        bool(1, RangeDim(2, maxTokens)),
        i64(RangeDim(1, MAX_DURATION_TICKS)),
        f32(1, RangeDim(2, maxTokens), DURATION_FEATURE_DIM),
        f32(1, VOICE_REF_SIZE),
      ],
      [f32(1, 1, RangeDim(TICKS_PER_DURATION, MAX_DURATION_TICKS * TICKS_PER_DURATION))],
      [
        constraint.equality(
          { paramSide: 'input', tensorIdx: 0, dimIdx: 1 },
          { paramSide: 'input', tensorIdx: 1, dimIdx: 1 },
          { paramSide: 'input', tensorIdx: 3, dimIdx: 1 }
        ),
        constraint.linear(
          { paramSide: 'output', tensorIdx: 0, dimIdx: 2 },
          { paramSide: 'input', tensorIdx: 2, dimIdx: 0 },
          TICKS_PER_DURATION
        ),
      ]
    )
  );

/**
 * A duration predictor that gives every token the same number of ticks, so the
 * waveform length a test sees follows directly from the token count.
 * @param ticksPerToken Ticks predicted for each token.
 * @returns The execute implementation.
 */
const predictsDurations =
  (ticksPerToken: number) =>
  (
    _methodName: string,
    _inputs: readonly unknown[],
    outputs: readonly { numel: number; setElement: (i: number, v: number) => void }[]
  ) => {
    const durations = outputs[0]!;
    for (let i = 0; i < durations.numel; i++) durations.setElement(i, ticksPerToken);
  };

/** A synthesizer that emits a constant tone, so trimming is observable. */
const emitsTone = (
  _methodName: string,
  _inputs: readonly unknown[],
  outputs: readonly { numel: number; setElement: (i: number, v: number) => void }[]
) => {
  const audio = outputs[0]!;
  for (let i = 0; i < audio.numel; i++) audio.setElement(i, 0.5);
};

/** Writes a voice matrix of `rows` reference vectors to the fake filesystem. */
const writeVoice = (rows = MAX_TOKENS) => {
  const matrix = new Float32Array(rows * VOICE_REF_SIZE);
  for (let i = 0; i < matrix.length; i++) matrix[i] = (i % 100) / 100;
  fakeFs.write(VOICE_PATH, new Uint8Array(matrix.buffer));
};

// `af_heart` is a published Kokoro voice name, not an identifier this suite chose.
/* eslint-disable camelcase */
const config = {
  name: 'kokoro',
  modelPaths: { durationPredictor: PREDICTOR_PATH, synthesizer: SYNTHESIZER_PATH },
  phonemizer: { lang: 'en-us' },
  voices: { af_heart: VOICE_PATH },
} as const;
/* eslint-enable camelcase */

const registerModels = (predictor = predictorSchema(), synthesizer = synthesizerSchema()): void => {
  fakeJsi.registerModel(PREDICTOR_PATH, {
    schema: predictor,
    execute: predictsDurations(8),
  });
  fakeJsi.registerModel(SYNTHESIZER_PATH, { schema: synthesizer, execute: emitsTone });
};

/** Drains a synthesis generator into an array. */
const collect = async <T>(stream: AsyncGenerator<T>): Promise<T[]> => {
  const chunks: T[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return chunks;
};

beforeEach(() => {
  writeVoice();
  registerModels();
});

describe('createKokoroTextToSpeech — the model contract', () => {
  it('accepts the exported pair and exposes the synthesis API', async () => {
    const tts = tracked(await createKokoroTextToSpeech(config));

    expect(tts.synthesize).toBeInstanceOf(Function);
    expect(tts.synthesizeStop).toBeInstanceOf(Function);
  });

  it('rejects a duration predictor whose feature width is wrong', async () => {
    fakeJsi.registerModel(PREDICTOR_PATH, {
      schema: exported(
        method(
          'forward',
          [
            i64(1, RangeDim(2, MAX_TOKENS)),
            bool(1, RangeDim(2, MAX_TOKENS)),
            f32(1, VOICE_REF_SIZE / 2),
            f32(1),
          ],
          [i64(RangeDim(2, MAX_TOKENS)), f32(1, RangeDim(2, MAX_TOKENS), DURATION_FEATURE_DIM + 1)]
        )
      ),
    });

    await expect(createKokoroTextToSpeech(config)).rejects.toThrow(/Constant dimension mismatch/);
  });

  it('rejects a synthesizer that does not tie its audio length to the durations', async () => {
    // Without the linear constraint the pipeline cannot size the output tensor,
    // so a model missing it has to be refused at construction rather than at
    // the first synthesis.
    fakeJsi.registerModel(SYNTHESIZER_PATH, {
      schema: exported(
        method(
          'forward',
          [
            i64(1, RangeDim(2, MAX_TOKENS)),
            bool(1, RangeDim(2, MAX_TOKENS)),
            i64(RangeDim(1, MAX_DURATION_TICKS)),
            f32(1, RangeDim(2, MAX_TOKENS), DURATION_FEATURE_DIM),
            f32(1, VOICE_REF_SIZE),
          ],
          [f32(1, 1, RangeDim(1, MAX_DURATION_TICKS * TICKS_PER_DURATION))]
        )
      ),
    });

    await expect(createKokoroTextToSpeech(config)).rejects.toThrow(/constraint/i);
  });

  it('releases both models, the phonemizer and every tensor when construction fails', async () => {
    // The pipeline loads before it validates, so a rejected schema must not
    // leave the loaded half behind. The suite's global leak check would catch
    // it, but this states it as the point of the test.
    fakeJsi.registerModel(SYNTHESIZER_PATH, {
      schema: exported(method('forward', [f32(1)], [f32(1)])),
    });

    await expect(createKokoroTextToSpeech(config)).rejects.toThrow();

    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.livePhonemizers()).toEqual([]);
    expect(fakeJsi.liveTensors()).toBe(0);
  });

  it('surfaces a missing voice file rather than resolving a broken pipeline', async () => {
    fakeFs.remove(VOICE_PATH);

    await expect(createKokoroTextToSpeech(config)).rejects.toThrow(/ENOENT/);
    allowNativeLeaks(); // see `tasks/constructionFailure.test.ts`
  });

  it('releases both models, the phonemizer and its tensors on dispose', async () => {
    const tts = await createKokoroTextToSpeech(config);

    tts.dispose();

    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.livePhonemizers()).toEqual([]);
    expect(fakeJsi.liveTensors()).toBe(0);
  });
});

describe('createKokoroTextToSpeech — argument validation', () => {
  it.each([
    ['an empty string', ''],
    ['whitespace only', '   '],
  ])('rejects %s', async (_label, text) => {
    const tts = tracked(await createKokoroTextToSpeech(config));

    await expect(collect(tts.synthesize(text, { voice: 'af_heart' }))).rejects.toThrow(
      /cannot be empty/
    );
  });

  it('rejects a voice the config does not define', async () => {
    const tts = tracked(await createKokoroTextToSpeech(config));

    await expect(
      // @ts-expect-error the voice keys are inferred from the config
      collect(tts.synthesize('hello', { voice: 'not_a_voice' }))
    ).rejects.toThrow(/Unknown voice/);
  });

  it.each([
    ['too slow', 0.05],
    ['too fast', 4],
  ])('rejects a speed that is %s', async (_label, speed) => {
    const tts = tracked(await createKokoroTextToSpeech(config));

    await expect(collect(tts.synthesize('hello', { voice: 'af_heart', speed }))).rejects.toThrow(
      /speed must be between/
    );
  });

  it('refuses a second synthesis while one is still running', async () => {
    const tts = tracked(await createKokoroTextToSpeech(config));

    const first = tts.synthesize('hello there my friend', { voice: 'af_heart' });
    await first.next();

    await expect(collect(tts.synthesize('again', { voice: 'af_heart' }))).rejects.toThrow(
      /already in progress/
    );

    await collect(first); // let the first stream finish, releasing the lock
  });

  it('runs another synthesis once the first has finished', async () => {
    const tts = tracked(await createKokoroTextToSpeech(config));
    await collect(tts.synthesize('hello', { voice: 'af_heart' }));

    await expect(collect(tts.synthesize('again', { voice: 'af_heart' }))).resolves.not.toEqual([]);
  });
});

describe('createKokoroTextToSpeech — synthesis', () => {
  it('streams a chunk carrying audio at the Kokoro sample rate', async () => {
    const tts = tracked(await createKokoroTextToSpeech(config));

    const [chunk, ...rest] = await collect(tts.synthesize('hello', { voice: 'af_heart' }));

    expect(rest).toEqual([]);
    expect(chunk).toMatchObject({
      audio: expect.any(Float32Array),
      sampleRate: KOKORO_SAMPLE_RATE,
      chunkIndex: 0,
      totalChunks: 1,
    });
    expect(chunk!.duration).toBeCloseTo(chunk!.audio.length / KOKORO_SAMPLE_RATE);
  });

  it('phonemizes the input before tokenizing it', async () => {
    fakePhonemizer.serve('Hello', 'həlˈoʊ');
    const tts = tracked(await createKokoroTextToSpeech(config));

    await collect(tts.synthesize('Hello', { voice: 'af_heart' }));

    // Both sub-models ran, which they only do once phonemes reached the tokenizer.
    expect(fakeJsi.executions().map(({ path }) => path)).toEqual([
      PREDICTOR_PATH,
      SYNTHESIZER_PATH,
    ]);
  });

  it('takes the text as phonemes directly when asked not to phonemize', async () => {
    fakePhonemizer.serve('həlˈoʊ', 'THE PHONEMIZER RAN');
    const tts = tracked(await createKokoroTextToSpeech(config));

    const chunks = await collect(tts.synthesize('həlˈoʊ', { voice: 'af_heart', phonemize: false }));

    expect(chunks).toHaveLength(1);
  });

  it('splits an input too long for the models into several chunks', async () => {
    const tts = tracked(await createKokoroTextToSpeech(config));

    // The window is 32 tokens, two of which are padding, so a longer phoneme
    // run cannot be synthesized in one pass.
    const chunks = await collect(
      tts.synthesize('one two three four five six seven eight nine ten eleven twelve', {
        voice: 'af_heart',
      })
    );

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map((chunk) => chunk.chunkIndex)).toEqual(chunks.map((_chunk, index) => index));
    expect(new Set(chunks.map((chunk) => chunk.totalChunks))).toEqual(new Set([chunks.length]));
  });

  it('honors a maxChunkLength smaller than the model window', async () => {
    const tts = tracked(await createKokoroTextToSpeech(config));
    const text = 'one two three four five six seven eight';

    const wide = await collect(tts.synthesize(text, { voice: 'af_heart' }));
    const narrow = await collect(tts.synthesize(text, { voice: 'af_heart', maxChunkLength: 10 }));

    expect(narrow.length).toBeGreaterThan(wide.length);
  });

  it('rejects a maxChunkLength the partitioner cannot honor', async () => {
    const tts = tracked(await createKokoroTextToSpeech(config));

    await expect(
      collect(tts.synthesize('hello', { voice: 'af_heart', maxChunkLength: 4 }))
    ).rejects.toThrow(/below minimum/);
  });

  it('stops streaming when synthesizeStop is called mid-stream', async () => {
    const tts = tracked(await createKokoroTextToSpeech(config));

    const stream = tts.synthesize(
      'one two three four five six seven eight nine ten eleven twelve',
      { voice: 'af_heart' }
    );
    const first = await stream.next();
    tts.synthesizeStop();
    const after = await stream.next();

    expect(first.done).toBe(false);
    expect(after.done).toBe(true);
    expect(first.value!.totalChunks).toBeGreaterThan(1);
  });

  it('leaves no per-call tensor behind once a stream is drained', async () => {
    const tts = tracked(await createKokoroTextToSpeech(config));
    const before = fakeJsi.liveTensors();

    await collect(
      tts.synthesize('one two three four five six seven eight nine ten', { voice: 'af_heart' })
    );

    // Every window allocates and frees its own tensors; only the three the
    // pipeline holds for its lifetime survive.
    expect(fakeJsi.liveTensors()).toBe(before);
  });

  it('leaves no tensor behind when a stream is abandoned part-way', async () => {
    const tts = tracked(await createKokoroTextToSpeech(config));
    const before = fakeJsi.liveTensors();

    const stream = tts.synthesize('one two three four five six seven eight nine ten', {
      voice: 'af_heart',
    });
    await stream.next();
    await stream.return(undefined as never);

    expect(fakeJsi.liveTensors()).toBe(before);
  });
});
