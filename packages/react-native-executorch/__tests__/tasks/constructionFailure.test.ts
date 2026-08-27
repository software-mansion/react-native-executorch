/**
 * What a `create<Task>` factory leaves behind when it throws.
 *
 * Every factory follows the same shape: load a model (and, depending on the
 * task, a tokenizer, a phonemizer, an LLM runner or a whole nested pipeline),
 * validate the schema, pre-allocate the execution tensors, and only then hand
 * back a `dispose`. A failure anywhere after the first allocation means the
 * caller never receives that `dispose`, so whatever was already allocated is
 * unreachable from JavaScript — and native memory is not garbage collected, so
 * it stays alive for the rest of the process.
 *
 * The exposure is not theoretical: `useModel` re-runs its factory whenever the
 * config changes, so an app pointed at a mismatched model would leak one
 * resource set per attempt.
 *
 * So every factory releases what it allocated before rethrowing, and this suite
 * holds them to it. The assertions are per-resource-kind rather than left to
 * the setup file's global leak check, so a failure says which factory and which
 * kind of handle, not just that something leaked.
 */
import { f32, method } from '../../src/core/schema';
import { createClassifier } from '../../src/extensions/cv/tasks/classification';
import { createImageEmbedder } from '../../src/extensions/cv/tasks/imageEmbedding';
import { createInstanceSegmenter } from '../../src/extensions/cv/tasks/instanceSegmentation';
import { createKeypointDetector } from '../../src/extensions/cv/tasks/keypointDetection';
import { createObjectDetector } from '../../src/extensions/cv/tasks/objectDetection';
import { createPaddleOcr } from '../../src/extensions/cv/tasks/paddleOcr';
import { createSdxsTextToImage } from '../../src/extensions/cv/tasks/sdxsTextToImage';
import { createSemanticSegmenter } from '../../src/extensions/cv/tasks/semanticSegmentation';
import { createStyleTransfer } from '../../src/extensions/cv/tasks/styleTransfer';
import { createPrivacyFilter } from '../../src/extensions/nlp/tasks/privacyFilter';
import { createTextEmbedder } from '../../src/extensions/nlp/tasks/textEmbedding';
import { createFsmnVoiceActivityDetector } from '../../src/extensions/speech/tasks/fsmnVoiceActivityDetection';
import { createKokoroTextToSpeech } from '../../src/extensions/speech/tasks/kokoroTextToSpeech';
import { createSupertonicTextToSpeech } from '../../src/extensions/speech/tasks/supertonicTextToSpeech';
import { createWhisperSpeechToText } from '../../src/extensions/speech/tasks/whisperSpeechToText';
import { fakeFs } from '../support/blobUtilMock';
import { fakeJsi } from '../support/fakeJsi';
import { STRETCH_PREPROCESSING, exported } from '../support/fixtures';

const MODEL_PATH = '/models/mismatched.pte';
const TOKENIZER_PATH = '/models/tokenizer.json';
const CHARSET_PATH = '/models/charset.json';
const VOICE_PATH = '/models/voice.bin';

/** A schema no task pipeline declares: two inputs, three outputs, wrong ranks. */
const MISMATCHED = exported(method('forward', [f32(9), f32(9)], [f32(9), f32(9), f32(9)]));

const CV_OPTS = {
  ...STRETCH_PREPROCESSING,
  resizeMode: 'stretch',
  outInterpolation: 'linear',
  outNormalizeOpts: { alpha: 255, beta: 0 },
  labels: ['a'],
  landmarks: ['nose'],
  boxFormat: 'xyxy',
  defaultIouThreshold: 0.5,
  defaultMaskThreshold: 0.5,
  defaultConfidenceThreshold: 0.5,
} as const;

const cv = { modelPath: MODEL_PATH, modelOpts: CV_OPTS } as const;
const tokenized = { modelPath: MODEL_PATH, tokenizerPath: TOKENIZER_PATH } as const;
const vadModel = {
  modelPath: MODEL_PATH,
  defaultOptions: {
    speechThreshold: 0.5,
    minSpeechDurationMs: 100,
    minSilenceDurationMs: 100,
    speechPadMs: 30,
    mergeGapMs: 100,
  },
} as const;

/**
 * Every factory that allocates something before it can fail, with whatever it
 * needs registered so the failure lands on schema validation rather than on the
 * load itself.
 *
 * `createTokenizer` is absent on purpose: it loads a tokenizer and returns, with
 * nothing in between that can throw, so it has no window to leak through.
 */
const factories: Record<string, () => Promise<unknown>> = {
  classifier: () => createClassifier(cv),
  objectDetector: () => createObjectDetector(cv),
  semanticSegmenter: () => createSemanticSegmenter(cv),
  styleTransfer: () => createStyleTransfer(cv),
  imageEmbedder: () => createImageEmbedder(cv),
  instanceSegmenter: () => createInstanceSegmenter(cv),
  keypointDetector: () => createKeypointDetector(cv),
  paddleOcr: () =>
    createPaddleOcr({
      modelPath: MODEL_PATH,
      charsetPath: CHARSET_PATH,
      modelOpts: { defaultConfidenceThreshold: 0.5 },
    }),
  sdxsTextToImage: () => createSdxsTextToImage(tokenized),
  textEmbedder: () => createTextEmbedder(tokenized),
  privacyFilter: () =>
    createPrivacyFilter({
      ...tokenized,
      modelOpts: { labelNames: ['O', 'B-p', 'I-p', 'E-p', 'S-p'], padTokenId: 0 },
    }),
  whisperSpeechToText: () =>
    createWhisperSpeechToText({
      ...tokenized,
      vadModel,
      supportedLanguages: ['en'],
    } as never),
  fsmnVoiceActivityDetector: () => createFsmnVoiceActivityDetector(vadModel),
  supertonicTextToSpeech: () =>
    createSupertonicTextToSpeech({
      name: 'supertonic',
      modelPaths: {
        durationPredictor: MODEL_PATH,
        vectorEstimator: MODEL_PATH,
        textEncoder: MODEL_PATH,
        vocoder: MODEL_PATH,
      },
      voices: { v: VOICE_PATH },
    } as never),
  kokoroTextToSpeech: () =>
    createKokoroTextToSpeech({
      name: 'kokoro',
      modelPaths: { durationPredictor: MODEL_PATH, synthesizer: MODEL_PATH },
      phonemizer: { lang: 'en-us' },
      voices: { v: VOICE_PATH },
    } as never),
};

/** Everything the fake still considers allocated, as one comparable object. */
const stillAllocated = () => ({
  models: fakeJsi.liveModels(),
  tokenizers: fakeJsi.liveTokenizers(),
  runners: fakeJsi.liveRunners(),
  phonemizers: fakeJsi.livePhonemizers(),
  tensors: fakeJsi.liveTensorDescriptions(),
});

const NOTHING = { models: [], tokenizers: [], runners: [], phonemizers: [], tensors: [] };

describe('create<Task> — schema validation failure', () => {
  beforeEach(() => {
    fakeJsi.registerModel(MODEL_PATH, { schema: MISMATCHED });
    fakeJsi.registerTokenizer(TOKENIZER_PATH, { tokens: ['a', 'b'] });
    fakeFs.write(CHARSET_PATH, JSON.stringify(['a', 'b', 'c']));
    fakeFs.write(VOICE_PATH, new Uint8Array(1024));
  });

  it.each(Object.entries(factories))('create%s rejects rather than resolving', async (_n, make) => {
    await expect(make()).rejects.toThrow();
  });

  it.each(Object.entries(factories))(
    'create%s releases everything it had allocated',
    async (_name, make) => {
      await expect(make()).rejects.toThrow();

      expect(stillAllocated()).toEqual(NOTHING);
    }
  );

  it.each(Object.entries(factories).filter(([name]) => name !== 'kokoroTextToSpeech'))(
    'create%s names every variant it tried',
    async (_name, make) => {
      // A caller should learn what is wrong from the message. Kokoro validates
      // two sub-models and reports whichever failed first, so its wording is
      // pinned in its own suite instead.
      await expect(make()).rejects.toThrow(/doesn't match any of the provided variants/);
    }
  );

  it('stays clean across repeated attempts, the way a re-rendering hook would', async () => {
    // `useModel` re-runs its factory on every config change. Before the
    // factories cleaned up, this leaked one model per attempt.
    for (const path of ['/a.pte', '/b.pte', '/c.pte']) {
      fakeJsi.registerModel(path, { schema: MISMATCHED });
      await expect(createClassifier({ ...cv, modelPath: path })).rejects.toThrow();
    }

    expect(stillAllocated()).toEqual(NOTHING);
  });
});

describe('create<Task> — load failure', () => {
  it.each(Object.entries(factories))(
    'create%s leaves nothing allocated when the model itself cannot be loaded',
    async (_name, make) => {
      // Nothing registered, so the very first load throws. The factory has
      // allocated nothing yet, but for the multi-resource pipelines a sibling
      // load may already have succeeded.
      fakeFs.write(CHARSET_PATH, JSON.stringify(['a', 'b', 'c']));
      fakeFs.write(VOICE_PATH, new Uint8Array(1024));

      await expect(make()).rejects.toThrow();

      expect(stillAllocated()).toEqual(NOTHING);
    }
  );
});
