/**
 * What a `create<Task>` factory leaves behind when it throws.
 *
 * Every factory follows the same shape: load the model (and, for some tasks, a
 * tokenizer), validate its schema, pre-allocate the execution tensors, and only
 * then hand back a `dispose`. If validation throws, the caller never receives a
 * `dispose` — so anything already allocated is unreachable from JavaScript and
 * stays alive in native memory for the process's lifetime.
 *
 * That is what these tests record. They are written as assertions on the
 * current* behavior rather than on the desired behavior, so the day a
 * factory starts cleaning up after itself they fail loudly and can be flipped,
 * instead of quietly passing either way.
 *
 * The exposure is real: `useModel` re-runs its factory whenever the config
 * changes, so an app pointed at a mismatched model leaks one native model per
 * attempt.
 */
import { f32, method } from '../../src/core/schema';
import { createClassifier } from '../../src/extensions/cv/tasks/classification';
import { createImageEmbedder } from '../../src/extensions/cv/tasks/imageEmbedding';
import { createObjectDetector } from '../../src/extensions/cv/tasks/objectDetection';
import { createSemanticSegmenter } from '../../src/extensions/cv/tasks/semanticSegmentation';
import { createStyleTransfer } from '../../src/extensions/cv/tasks/styleTransfer';
import { fakeJsi } from '../support/fakeJsi';
import { STRETCH_PREPROCESSING, exported } from '../support/fixtures';
import { allowNativeLeaks } from '../support/setup';

const MODEL_PATH = '/models/mismatched.pte';

/** A schema no task pipeline declares: two inputs, three outputs, wrong ranks. */
const MISMATCHED = exported(method('forward', [f32(9), f32(9)], [f32(9), f32(9), f32(9)]));

const CV_OPTS = {
  ...STRETCH_PREPROCESSING,
  resizeMode: 'stretch',
  outInterpolation: 'linear',
  outNormalizeOpts: { alpha: 255, beta: 0 },
  labels: ['a'],
  boxFormat: 'xyxy',
  defaultIouThreshold: 0.5,
  defaultConfidenceThreshold: 0.5,
} as const;

const factories = {
  classifier: () => createClassifier({ modelPath: MODEL_PATH, modelOpts: CV_OPTS }),
  objectDetector: () => createObjectDetector({ modelPath: MODEL_PATH, modelOpts: CV_OPTS }),
  semanticSegmenter: () => createSemanticSegmenter({ modelPath: MODEL_PATH, modelOpts: CV_OPTS }),
  styleTransfer: () => createStyleTransfer({ modelPath: MODEL_PATH, modelOpts: CV_OPTS }),
  imageEmbedder: () => createImageEmbedder({ modelPath: MODEL_PATH, modelOpts: CV_OPTS }),
};

describe('create<Task> — schema validation failure', () => {
  beforeEach(() => {
    fakeJsi.registerModel(MODEL_PATH, { schema: MISMATCHED });
  });

  it.each(Object.entries(factories))(
    'create%s rejects with a message naming every variant it tried',
    async (_name, factory) => {
      await expect(factory()).rejects.toThrow(/doesn't match any of the provided variants/);
      allowNativeLeaks();
    }
  );

  it.each(Object.entries(factories))(
    'create%s abandons the loaded native model (known leak)',
    async (_name, factory) => {
      await expect(factory()).rejects.toThrow();

      expect(fakeJsi.liveModels()).toEqual([MODEL_PATH]);
      allowNativeLeaks();
    }
  );

  it('leaks one model per failed attempt, the way a re-rendering hook would', async () => {
    for (const path of ['/a.pte', '/b.pte', '/c.pte']) {
      fakeJsi.registerModel(path, { schema: MISMATCHED });
      await expect(createClassifier({ modelPath: path, modelOpts: CV_OPTS })).rejects.toThrow();
    }

    expect(fakeJsi.liveModels()).toEqual(['/a.pte', '/b.pte', '/c.pte']);
    allowNativeLeaks();
  });
});

describe('create<Task> — load failure', () => {
  it.each(Object.entries(factories))(
    'create%s leaves nothing allocated when the model itself cannot be loaded',
    async (_name, factory) => {
      // Nothing registered at MODEL_PATH, so `loadModel` throws before any
      // allocation happens — the one failure path that is already clean.
      await expect(factory()).rejects.toThrow(/mismatched.pte/);

      expect(fakeJsi.liveModels()).toEqual([]);
      expect(fakeJsi.liveTensors()).toBe(0);
    }
  );
});
