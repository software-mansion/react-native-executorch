/**
 * Schema acceptance and disposal for the pipelines that are not exercised
 * end to end elsewhere.
 *
 * Keypoint detection, instance segmentation, VAD, Whisper and SDXS each carry
 * a long stateful `worklet` — a decode loop, a rolling audio window, a
 * diffusion step — whose behavior depends on real model weights rather than on
 * the TypeScript around them. Faking a whole Whisper decode would mostly test
 * the fixture.
 *
 * What is worth pinning down here is the part that is pure contract: the exact
 * signature each pipeline accepts, that a mismatch is rejected rather than
 * crashing later inside `execute`, and that `dispose()` releases every native
 * handle the pipeline took — including the nested ones (Whisper owns a
 * tokenizer and a whole VAD pipeline).
 */
import { RangeDim, f32, i64, method } from '../../src/core/schema';
import { createInstanceSegmenter } from '../../src/extensions/cv/tasks/instanceSegmentation';
import { createKeypointDetector } from '../../src/extensions/cv/tasks/keypointDetection';
import { createSdxsTextToImage } from '../../src/extensions/cv/tasks/sdxsTextToImage';
import { createFsmnVoiceActivityDetector } from '../../src/extensions/speech/tasks/fsmnVoiceActivityDetection';
import { createWhisperSpeechToText } from '../../src/extensions/speech/tasks/whisperSpeechToText';
import { fakeJsi } from '../support/fakeJsi';
import { STRETCH_PREPROCESSING, exported } from '../support/fixtures';
import { allowNativeLeaks } from '../support/setup';

const MODEL_PATH = '/models/task.pte';
const TOKENIZER_PATH = '/models/tokenizer.json';
const VAD_PATH = '/models/vad.pte';

// ============================================================================
// Keypoint detection
// ============================================================================

describe('createKeypointDetector', () => {
  const LANDMARKS = ['nose', 'left_eye', 'right_eye'] as const;
  const config = {
    modelPath: MODEL_PATH,
    modelOpts: {
      ...STRETCH_PREPROCESSING,
      resizeMode: 'stretch',
      boxFormat: 'xyxy',
      landmarks: LANDMARKS,
      defaultIouThreshold: 0.5,
      defaultConfidenceThreshold: 0.5,
    },
  } as const;

  it('accepts a model whose keypoint output matches the landmark count', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(
        method('forward', [f32(1, 3, 8, 8)], [f32(2, 4), f32(2), f32(2, LANDMARKS.length, 3)])
      ),
    });

    const detector = await createKeypointDetector(config);
    expect(detector.detectKeypoints).toBeInstanceOf(Function);

    detector.dispose();
    expect(fakeJsi.liveTensors()).toBe(0);
    expect(fakeJsi.liveModels()).toEqual([]);
  });

  it('rejects a model whose keypoint output has a different landmark count', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('forward', [f32(1, 3, 8, 8)], [f32(2, 4), f32(2), f32(2, 17, 3)])),
    });

    await expect(createKeypointDetector(config)).rejects.toThrow(/Constant dimension mismatch/);
    allowNativeLeaks(); // see `tasks/constructionFailure.test.ts`
  });

  it('has no unbatched variant', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(
        method('forward', [f32(3, 8, 8)], [f32(2, 4), f32(2), f32(2, LANDMARKS.length, 3)])
      ),
    });

    await expect(createKeypointDetector(config)).rejects.toThrow(/Rank mismatch/);
    allowNativeLeaks(); // see `tasks/constructionFailure.test.ts`
  });
});

// ============================================================================
// Instance segmentation
// ============================================================================

describe('createInstanceSegmenter', () => {
  const config = {
    modelPath: MODEL_PATH,
    modelOpts: {
      ...STRETCH_PREPROCESSING,
      resizeMode: 'stretch',
      labels: ['person', 'car'],
      boxFormat: 'xyxy',
      defaultIouThreshold: 0.5,
      defaultMaskThreshold: 0.5,
      defaultConfidenceThreshold: 0.5,
    },
  } as const;

  const outputs = [f32(2, 4), f32(2), f32(2), f32(2, 6, 6)];

  it.each([
    ['batched', [f32(1, 3, 8, 8)]],
    ['unbatched', [f32(3, 8, 8)]],
  ])('accepts the %s variant and disposes cleanly', async (_variant, inputs) => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('forward', inputs, outputs)),
    });

    const segmenter = await createInstanceSegmenter(config);
    expect(segmenter.segmentInstances).toBeInstanceOf(Function);

    segmenter.dispose();
    expect(fakeJsi.liveTensors()).toBe(0);
    expect(fakeJsi.liveModels()).toEqual([]);
  });

  it('allows the mask resolution to differ from the input resolution', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(
        method('forward', [f32(1, 3, 32, 32)], [f32(2, 4), f32(2), f32(2), f32(2, 6, 10)])
      ),
    });

    const segmenter = await createInstanceSegmenter(config);
    expect(segmenter.segmentInstances).toBeInstanceOf(Function);
    segmenter.dispose();
  });

  it('requires every output to agree on the instance count', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(
        method('forward', [f32(1, 3, 8, 8)], [f32(2, 4), f32(2), f32(2), f32(3, 6, 6)])
      ),
    });

    await expect(createInstanceSegmenter(config)).rejects.toThrow(/inconsistent bindings/);
    allowNativeLeaks(); // see `tasks/constructionFailure.test.ts`
  });
});

// ============================================================================
// Voice activity detection
// ============================================================================

// The exported spec is concrete: `frames` is a real range in both the input
// and the output, which is what the pipeline's `Dyn('frames')` binds to.
const FRAMES = RangeDim(1, 500);
const VAD_SCHEMA = exported(method('forward', [f32(FRAMES, 400)], [f32(1, FRAMES, 2)]));

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

describe('createFsmnVoiceActivityDetector', () => {
  it('accepts a model with a dynamic frame count and disposes cleanly', async () => {
    fakeJsi.registerModel(VAD_PATH, { schema: VAD_SCHEMA });

    const vad = await createFsmnVoiceActivityDetector(VAD_CONFIG);
    expect(vad.detectVoice).toBeInstanceOf(Function);

    vad.dispose();
    expect(fakeJsi.liveTensors()).toBe(0);
    expect(fakeJsi.liveModels()).toEqual([]);
  });

  it('rejects a model whose frame count is static', async () => {
    fakeJsi.registerModel(VAD_PATH, {
      schema: exported(method('forward', [f32(100, 400)], [f32(1, 100, 2)])),
    });

    await expect(createFsmnVoiceActivityDetector(VAD_CONFIG)).rejects.toThrow(
      /Cannot match symbolic 'dynamic' with concrete 'constant'/
    );
    allowNativeLeaks(); // see `tasks/constructionFailure.test.ts`
  });

  it('requires the input and output frame dimensions to share a domain', async () => {
    fakeJsi.registerModel(VAD_PATH, {
      schema: exported(
        method('forward', [f32(RangeDim(1, 500), 400)], [f32(1, RangeDim(1, 250), 2)])
      ),
    });

    await expect(createFsmnVoiceActivityDetector(VAD_CONFIG)).rejects.toThrow(
      /inconsistent bindings/
    );
    allowNativeLeaks(); // see `tasks/constructionFailure.test.ts`
  });

  it('returns no segments for a waveform shorter than one analysis frame', async () => {
    fakeJsi.registerModel(VAD_PATH, { schema: VAD_SCHEMA });

    const vad = await createFsmnVoiceActivityDetector(VAD_CONFIG);
    expect(await vad.detectVoice(new Float32Array(100))).toEqual([]);
    vad.dispose();
  });
});

// ============================================================================
// Whisper speech to text
// ============================================================================

describe('createWhisperSpeechToText', () => {
  // Whisper pads internally, so the exported encode input is a dynamic range.
  const AUDIO_SAMPLES = RangeDim(1, 480000);
  const config = {
    modelPath: MODEL_PATH,
    tokenizerPath: TOKENIZER_PATH,
    supportedLanguages: ['en'],
    vadModel: VAD_CONFIG,
  } as const;

  const register = () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported({
        ...method('encode', [f32(AUDIO_SAMPLES)], [f32(1, 1500, 384)]),
        ...method('decode', [i64(1, 1), i64(1), f32(1, 1500, 384)], [f32(1, 1, 51865)]),
      }),
    });
    fakeJsi.registerModel(VAD_PATH, { schema: VAD_SCHEMA });
    fakeJsi.registerTokenizer(TOKENIZER_PATH, {
      tokens: ['<|endoftext|>', 'hello', 'world'],
      specialIds: [0],
    });
  };

  it('accepts a model exporting both encode and decode', async () => {
    register();

    const stt = await createWhisperSpeechToText(config);
    expect(stt.transcribe).toBeInstanceOf(Function);
    expect(stt.stream).toBeInstanceOf(Function);

    stt.dispose();
  });

  it('releases the model, the tokenizer and the nested VAD pipeline on dispose', async () => {
    register();

    const stt = await createWhisperSpeechToText(config);
    expect(fakeJsi.liveModels()).toEqual([MODEL_PATH, VAD_PATH]);

    stt.dispose();

    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.liveTokenizers()).toEqual([]);
    expect(fakeJsi.liveTensors()).toBe(0);
  });

  it('rejects a model missing the decode method', async () => {
    register();
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('encode', [f32(AUDIO_SAMPLES)], [f32(1, 1500, 384)])),
    });

    await expect(createWhisperSpeechToText(config)).rejects.toThrow(
      /Method 'decode' not found in exported model spec/
    );
    allowNativeLeaks(); // see `tasks/constructionFailure.test.ts`
  });

  it('requires encode and decode to agree on the encoder state shape', async () => {
    register();
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported({
        ...method('encode', [f32(AUDIO_SAMPLES)], [f32(1, 1500, 384)]),
        ...method('decode', [i64(1, 1), i64(1), f32(1, 1500, 512)], [f32(1, 1, 51865)]),
      }),
    });

    await expect(createWhisperSpeechToText(config)).rejects.toThrow(/inconsistent bindings/);
    allowNativeLeaks(); // see `tasks/constructionFailure.test.ts`
  });

  it('fails when the tokenizer has no end-of-text token', async () => {
    register();
    fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: ['hello'] });

    await expect(createWhisperSpeechToText(config)).rejects.toThrow(/<\|endoftext\|>/);
    allowNativeLeaks(); // see `tasks/constructionFailure.test.ts`
  });
});

// ============================================================================
// SDXS text to image
// ============================================================================

describe('createSdxsTextToImage', () => {
  const config = { modelPath: MODEL_PATH, tokenizerPath: TOKENIZER_PATH };

  const SDXS_SCHEMA = exported({
    ...method('encode', [i64(1, 77)], [f32(1, 77, 768)]),
    ...method('denoise', [f32(1, 4, 64, 64), i64(1), f32(1, 77, 768)], [f32(1, 4, 64, 64)]),
    ...method('decode', [f32(1, 4, 64, 64)], [f32(1, 3, 512, 512)]),
  });

  it('accepts the three-method SDXS contract and disposes cleanly', async () => {
    fakeJsi.registerModel(MODEL_PATH, { schema: SDXS_SCHEMA });
    fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: ['a', 'cat'] });

    const tti = await createSdxsTextToImage(config);
    expect(tti.generate).toBeInstanceOf(Function);

    tti.dispose();
    expect(fakeJsi.liveTensors()).toBe(0);
    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.liveTokenizers()).toEqual([]);
  });

  it('rejects a model that is missing the denoise method', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported({
        ...method('encode', [i64(1, 77)], [f32(1, 77, 768)]),
        ...method('decode', [f32(1, 4, 64, 64)], [f32(1, 3, 512, 512)]),
      }),
    });
    fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: ['a'] });

    await expect(createSdxsTextToImage(config)).rejects.toThrow(/Method 'denoise' not found/);
    allowNativeLeaks(); // see `tasks/constructionFailure.test.ts`
  });

  it('rejects a text encoder with a different hidden size', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported({
        ...method('encode', [i64(1, 77)], [f32(1, 77, 512)]),
        ...method('denoise', [f32(1, 4, 64, 64), i64(1), f32(1, 77, 512)], [f32(1, 4, 64, 64)]),
        ...method('decode', [f32(1, 4, 64, 64)], [f32(1, 3, 512, 512)]),
      }),
    });
    fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: ['a'] });

    await expect(createSdxsTextToImage(config)).rejects.toThrow(/Constant dimension mismatch/);
    allowNativeLeaks(); // see `tasks/constructionFailure.test.ts`
  });
});
