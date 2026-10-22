/**
 * Qwen3-ASR pipeline contract: the four-method schema (with a dynamic or a
 * static encoder window), how audio is cut into encoder windows, how the
 * prompt is assembled around the audio embeddings, and how the model's
 * `language <Name><asr_text>` header is stripped from the transcript.
 *
 * The fake decoder replays a scripted token sequence, so these tests pin the
 * TypeScript around the model rather than the model itself.
 */
import { ConstantDim, RangeDim, f32, i64, method } from '../../src/core/schema';
import { createQwen3AsrSpeechToText } from '../../src/extensions/speech/tasks/qwen3AsrSpeechToText';
import { fakeJsi } from '../support/fakeJsi';
import type { FakeTensor } from '../support/fakeTensor';
import { exported } from '../support/fixtures';

const MODEL_PATH = '/models/qwen3-asr.pte';
const TOKENIZER_PATH = '/models/tokenizer.json';
const VAD_PATH = '/models/vad.pte';

const VAD_FRAMES = RangeDim(1, 500);
const VAD_SCHEMA = exported(method('forward', [f32(VAD_FRAMES, 400)], [f32(1, VAD_FRAMES, 2)]));
const VAD_CONFIG = {
  modelPath: VAD_PATH,
  defaultOptions: {
    speechThreshold: 0.5,
    minSpeechDurationMs: 250,
    minSilenceDurationMs: 100,
    speechPadMs: 30,
    mergeGapMs: 100,
  },
} as const;

const config = {
  name: 'qwen3-asr',
  modelPath: MODEL_PATH,
  tokenizerPath: TOKENIZER_PATH,
  vadModel: VAD_CONFIG,
} as const;

// prettier-ignore
const TOKENS = [
  '<|endoftext|>', '<|im_start|>', '<|im_end|>', '<|audio_start|>', '<|audio_end|>',
  '<asr_text>', 'system', 'user', 'assistant', 'language', 'English', 'hello', 'world',
];
const ID = Object.fromEntries(TOKENS.map((t, i) => [t, i]));
const DIM = 4;
const VOCAB = TOKENS.length;

const spec = (melFrames = RangeDim(100, 800, 100), audioTokens = RangeDim(13, 104, 13)) =>
  exported({
    ...method('preprocess', [f32(RangeDim(401, 480000))], [f32(1, 128, RangeDim(2, 3000))]),
    ...method('audio_encoder', [f32(1, 128, melFrames), i64(1)], [f32(1, audioTokens, DIM)]),
    ...method('token_embedding', [i64(1, RangeDim(1, 1024))], [f32(1, RangeDim(1, 1024), DIM)]),
    ...method('text_decoder', [f32(1, RangeDim(1, 1023), DIM), i64(1)], [f32(1, VOCAB)]),
  });

type Calls = {
  encoder: { width: number; valid: number }[];
  decoder: { length: number; position: number }[];
};

/** Registers the model with a decoder that replays `script`, one token per call. */
const register = (script: string[], schema = spec()) => {
  const calls: Calls = { encoder: [], decoder: [] };
  let step = 0;
  fakeJsi.registerModel(MODEL_PATH, {
    schema,
    execute: (name, inputs, outputs) => {
      const [a, b] = inputs as FakeTensor[];
      if (name === 'audio_encoder') {
        calls.encoder.push({ width: a!.shape[2]!, valid: Number(b!.getElement(0)) });
      } else if (name === 'text_decoder') {
        calls.decoder.push({ length: a!.shape[1]!, position: Number(b!.getElement(0)) });
        const logits = outputs[0]!;
        for (let i = 0; i < VOCAB; i++) logits.setElement(i, 0);
        logits.setElement(ID[script[Math.min(step++, script.length - 1)]!]!, 1);
      }
    },
  });
  fakeJsi.registerModel(VAD_PATH, { schema: VAD_SCHEMA });
  fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: TOKENS, specialIds: [0, 1, 2, 3, 4, 5] });
  return calls;
};

const seconds = (s: number) => new Float32Array(s * 16000);

describe('createQwen3AsrSpeechToText', () => {
  it('strips the detected-language header from the transcript', async () => {
    register(['language', 'English', '<asr_text>', 'hello', 'world', '<|im_end|>']);
    const stt = await createQwen3AsrSpeechToText(config);

    const streamed: string[] = [];
    const text = await stt.transcribe(seconds(3), undefined, (t) => streamed.push(t));

    expect(text).toBe('hello world');
    // Tokens reach the RN thread through scheduleOnRN, a macrotask.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(streamed).toEqual(['hello', 'world']);
    stt.dispose();
  });

  it('prefills the prompt around the audio, then decodes one position at a time', async () => {
    const calls = register(['language', 'English', '<asr_text>', 'hello', '<|im_end|>']);
    const stt = await createQwen3AsrSpeechToText(config);

    await stt.transcribe(seconds(3));

    // 3 s = 300 mel frames = 39 audio tokens, between a 6-token prefix
    // (<|im_start|> system <|im_end|> <|im_start|> user <|audio_start|>) and a
    // 4-token suffix (<|audio_end|> <|im_end|> <|im_start|> assistant).
    const promptLength = 6 + 39 + 4;
    expect(calls.decoder[0]).toEqual({ length: promptLength, position: 0 });
    expect(calls.decoder.slice(1)).toEqual(
      [0, 1, 2, 3].map((i) => ({ length: 1, position: promptLength + i }))
    );
    stt.dispose();
  });

  it('forces the language through the prompt and keeps every token', async () => {
    const calls = register(['hello', 'world', '<|im_end|>']);
    const stt = await createQwen3AsrSpeechToText(config);

    const text = await stt.transcribe(seconds(3), { language: 'en' });

    expect(text).toBe('hello world');
    // The suffix grows by `language English <asr_text>`.
    expect(calls.decoder[0]!.length).toBe(6 + 39 + 4 + 3);
    stt.dispose();
  });

  it('returns nothing for audio the model marks as speechless', async () => {
    register(['language', '<asr_text>', '<|im_end|>']);
    const stt = await createQwen3AsrSpeechToText(config);

    expect(await stt.transcribe(seconds(2))).toBe('');
    stt.dispose();
  });

  it('encodes 8 s windows, the last one cut to whole chunks', async () => {
    const calls = register(['<asr_text>', '<|im_end|>']);
    const stt = await createQwen3AsrSpeechToText(config);

    // 10.5 s = 1050 frames: one full window, then 250 frames padded to 300.
    await stt.transcribe(new Float32Array(10.5 * 16000));

    expect(calls.encoder).toEqual([
      { width: 800, valid: 104 },
      { width: 300, valid: 33 },
    ]);
    stt.dispose();
  });

  it('pads every window to 8 s for a static encoder', async () => {
    const calls = register(['<asr_text>', '<|im_end|>'], spec(ConstantDim(800), ConstantDim(104)));
    const stt = await createQwen3AsrSpeechToText(config);

    await stt.transcribe(new Float32Array(10.5 * 16000));

    expect(calls.encoder).toEqual([
      { width: 800, valid: 104 },
      { width: 800, valid: 33 },
    ]);
    stt.dispose();
  });

  it('zero-pads audio shorter than half a second', async () => {
    const calls = register(['<asr_text>', '<|im_end|>']);
    const stt = await createQwen3AsrSpeechToText(config);

    await stt.transcribe(new Float32Array(1000));

    // 0.5 s = 50 frames = 7 tokens.
    expect(calls.encoder).toEqual([{ width: 100, valid: 7 }]);
    stt.dispose();
  });

  it('rejects an unsupported language', async () => {
    register(['<|im_end|>']);
    const stt = await createQwen3AsrSpeechToText(config);

    await expect(stt.transcribe(seconds(1), { language: 'xx' as never })).rejects.toThrow(
      /not supported/
    );
    stt.dispose();
  });

  it('rejects a decoder whose hidden size differs from the encoder', async () => {
    register(['<|im_end|>']);
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported({
        ...spec(),
        ...method('text_decoder', [f32(1, RangeDim(1, 1023), DIM * 2), i64(1)], [f32(1, VOCAB)]),
      }),
    });

    await expect(createQwen3AsrSpeechToText(config)).rejects.toThrow(
      /doesn't match any of the provided variants/
    );
  });

  it('releases the model, the tokenizer and the nested VAD pipeline on dispose', async () => {
    register(['<|im_end|>']);
    const stt = await createQwen3AsrSpeechToText(config);
    expect(fakeJsi.liveModels()).toEqual([MODEL_PATH, VAD_PATH]);

    stt.dispose();

    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.liveTokenizers()).toEqual([]);
    expect(fakeJsi.liveTensors()).toBe(0);
  });
});
