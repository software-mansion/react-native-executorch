import { f32, method } from '../../src/core/schema';
import { createClassifier } from '../../src/extensions/cv/tasks/classification';
import { fakeJsi } from '../support/fakeJsi';
import { tracked } from '../support/lifetime';
import { STRETCH_PREPROCESSING, exported, imageBuffer, writesOutputs } from '../support/fixtures';

const MODEL_PATH = '/models/classifier.pte';
const LABELS = ['cat', 'dog', 'bird'] as const;

/** Logits chosen so softmax orders them bird > cat > dog. */
const LOGITS = [1, 0, 2];

const registerBatched = (labels: readonly string[] = LABELS) => {
  fakeJsi.registerModel(MODEL_PATH, {
    schema: exported(method('forward', [f32(1, 3, 4, 4)], [f32(1, labels.length)])),
    execute: writesOutputs(LOGITS),
  });
};

const config = (labels: readonly string[] = LABELS) => ({
  modelPath: MODEL_PATH,
  modelOpts: { ...STRETCH_PREPROCESSING, labels },
});

describe('createClassifier — model acceptance', () => {
  it('accepts a batched [1, 3, H, W] -> [1, N] model', async () => {
    registerBatched();
    const classifier = tracked(await createClassifier(config()));
    expect(classifier.classify).toBeInstanceOf(Function);
  });

  it('accepts an unbatched [3, H, W] -> [N] model', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('forward', [f32(3, 4, 4)], [f32(3)])),
      execute: writesOutputs(LOGITS),
    });

    const classifier = tracked(await createClassifier(config()));
    expect(await classifier.classify(imageBuffer(4, 4))).toHaveLength(3);
  });

  it('rejects a model whose signature matches no variant', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('forward', [f32(1, 3, 4, 4)], [f32(1, 3), f32(1, 3)])),
    });

    await expect(createClassifier(config())).rejects.toThrow(/doesn't match any of the provided/);
  });

  it('rejects a labels array that does not match the output dimension', async () => {
    registerBatched();
    await expect(createClassifier(config(['cat', 'dog']))).rejects.toThrow(
      /labels length \(2\) must match model output dimension \(3\)/
    );
  });

  it('surfaces a load failure', async () => {
    await expect(
      createClassifier({ ...config(), modelPath: '/models/absent.pte' })
    ).rejects.toThrow(/absent.pte/);
  });
});

describe('createClassifier — classify', () => {
  beforeEach(registerBatched);

  it('returns every class, sorted by descending confidence', async () => {
    const classifier = tracked(await createClassifier(config()));

    const results = await classifier.classify(imageBuffer(8, 8));

    expect(results.map((r) => r.label)).toEqual(['bird', 'cat', 'dog']);
  });

  it('returns softmax probabilities that sum to one', async () => {
    const classifier = tracked(await createClassifier(config()));

    const results = await classifier.classify(imageBuffer(8, 8));

    const total = results.reduce((sum, r) => sum + r.confidence, 0);
    expect(total).toBeCloseTo(1, 5);
    // exp(2) / (exp(0) + exp(1) + exp(2))
    expect(results[0]!.confidence).toBeCloseTo(0.6652, 3);
  });

  it('truncates to topk', async () => {
    const classifier = tracked(await createClassifier(config()));

    expect(await classifier.classify(imageBuffer(8, 8), { topk: 1 })).toEqual([
      { label: 'bird', confidence: expect.any(Number) },
    ]);
  });

  it('returns nothing for topk 0', async () => {
    const classifier = tracked(await createClassifier(config()));
    expect(await classifier.classify(imageBuffer(8, 8), { topk: 0 })).toEqual([]);
  });

  it('rejects a negative topk', async () => {
    const classifier = tracked(await createClassifier(config()));
    await expect(classifier.classify(imageBuffer(8, 8), { topk: -1 })).rejects.toThrow(
      /non-negative/
    );
  });

  it('accepts every supported input pixel format', async () => {
    const classifier = tracked(await createClassifier(config()));

    for (const format of ['rgb', 'rgba', 'bgr', 'bgra', 'gray'] as const) {
      expect(await classifier.classify(imageBuffer(6, 5, format), { topk: 1 })).toHaveLength(1);
    }
  });

  it('resizes an input of any size onto the model input', async () => {
    const classifier = tracked(await createClassifier(config()));

    for (const [width, height] of [
      [4, 4],
      [16, 9],
      [1, 1],
    ]) {
      expect(await classifier.classify(imageBuffer(width!, height!), { topk: 1 })).toHaveLength(1);
    }
  });

  it('runs the exported forward method once per call', async () => {
    const classifier = tracked(await createClassifier(config()));

    await classifier.classify(imageBuffer(8, 8));
    await classifier.classify(imageBuffer(8, 8));

    expect(fakeJsi.executions()).toEqual([
      { path: MODEL_PATH, methodName: 'forward' },
      { path: MODEL_PATH, methodName: 'forward' },
    ]);
  });

  it('produces the same result synchronously and asynchronously', async () => {
    const classifier = tracked(await createClassifier(config()));
    const input = imageBuffer(8, 8);

    expect(classifier.classifyWorklet(input)).toEqual(await classifier.classify(input));
  });
});

describe('createClassifier — lifetime', () => {
  beforeEach(registerBatched);

  it('releases every native resource on dispose', async () => {
    const classifier = tracked(await createClassifier(config()));
    expect(fakeJsi.liveTensors()).toBeGreaterThan(0);

    classifier.dispose();

    expect(fakeJsi.liveTensors()).toBe(0);
    expect(fakeJsi.liveModels()).toEqual([]);
  });

  it('frees the scratch tensors allocated per call', async () => {
    const classifier = tracked(await createClassifier(config()));
    const afterConstruction = fakeJsi.liveTensors();

    await classifier.classify(imageBuffer(32, 24));

    expect(fakeJsi.liveTensors()).toBe(afterConstruction);
  });
});
