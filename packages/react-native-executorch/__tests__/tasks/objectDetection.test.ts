import { f32, method } from '../../src/core/schema';
import { createObjectDetector } from '../../src/extensions/cv/tasks/objectDetection';
import { fakeJsi } from '../support/fakeJsi';
import { tracked } from '../support/lifetime';
import { STRETCH_PREPROCESSING, exported, imageBuffer, writesOutputs } from '../support/fixtures';

const MODEL_PATH = '/models/detector.pte';
const LABELS = ['person', 'car', 'dog'] as const;

// Model geometry: 16x16 input, three candidate boxes in xyxy.
const MODEL_SIZE = 16;

/**
 * Boxes 0 and 1 overlap (IoU 49/79 = 0.62); box 2 is disjoint. Scores are
 * chosen so box 1 wins its overlap group and every box clears the default
 * confidence threshold.
 */
const BOXES = [
  0,
  0,
  8,
  8, // box 0
  1,
  1,
  9,
  9, // box 1
  12,
  12,
  16,
  16, // box 2
];
const SCORES = [0.6, 0.9, 0.7];
const CLASSES = [0, 1, 2];

const options = {
  ...STRETCH_PREPROCESSING,
  resizeMode: 'stretch',
  labels: LABELS,
  boxFormat: 'xyxy',
  defaultIouThreshold: 0.5,
  defaultConfidenceThreshold: 0.5,
} as const;

const register = (classes: number[] = CLASSES) => {
  fakeJsi.registerModel(MODEL_PATH, {
    schema: exported(
      method('forward', [f32(1, 3, MODEL_SIZE, MODEL_SIZE)], [f32(3, 4), f32(3), f32(3)])
    ),
    execute: writesOutputs(BOXES, SCORES, classes),
  });
};

const config = { modelPath: MODEL_PATH, modelOpts: options };

describe('createObjectDetector — detection', () => {
  beforeEach(() => register());

  it('suppresses overlapping boxes and keeps the highest scoring one', async () => {
    const detector = tracked(await createObjectDetector(config));

    const detections = await detector.detectObjects(imageBuffer(MODEL_SIZE, MODEL_SIZE));

    expect(detections.map((d) => d.label)).toEqual(['car', 'dog']);
  });

  it('maps class indices to their labels and keeps the confidence', async () => {
    const detector = tracked(await createObjectDetector(config));

    const [best] = await detector.detectObjects(imageBuffer(MODEL_SIZE, MODEL_SIZE));

    expect(best!.label).toBe('car');
    expect(best!.confidence).toBeCloseTo(0.9, 5);
  });

  it('returns boxes in the configured format', async () => {
    const detector = tracked(await createObjectDetector(config));

    const [best] = await detector.detectObjects(imageBuffer(MODEL_SIZE, MODEL_SIZE));

    expect(best!.box).toEqual({ format: 'xyxy', xmin: 1, ymin: 1, xmax: 9, ymax: 9 });
  });

  it('scales boxes from the model input back to the original image size', async () => {
    const detector = tracked(await createObjectDetector(config));

    // The image is twice the model input, so every coordinate doubles.
    const [best] = await detector.detectObjects(imageBuffer(MODEL_SIZE * 2, MODEL_SIZE * 2));

    expect(best!.box).toEqual({ format: 'xyxy', xmin: 2, ymin: 2, xmax: 18, ymax: 18 });
  });

  it('drops candidates below the default confidence threshold', async () => {
    const detector = tracked(
      await createObjectDetector({
        ...config,
        modelOpts: { ...options, defaultConfidenceThreshold: 0.8 },
      })
    );

    const detections = await detector.detectObjects(imageBuffer(MODEL_SIZE, MODEL_SIZE));

    expect(detections.map((d) => d.label)).toEqual(['car']);
  });

  it('lets a per-call confidence threshold override the default', async () => {
    const detector = tracked(await createObjectDetector(config));

    const detections = await detector.detectObjects(imageBuffer(MODEL_SIZE, MODEL_SIZE), {
      confidenceThreshold: 0.95,
    });

    expect(detections).toEqual([]);
  });

  it('lets a per-call IoU threshold override the default', async () => {
    const detector = tracked(await createObjectDetector(config));

    // A threshold above the pair's IoU stops the suppression, so the
    // lower-scoring overlapping box survives.
    const detections = await detector.detectObjects(imageBuffer(MODEL_SIZE, MODEL_SIZE), {
      iouThreshold: 0.9,
    });

    expect(detections.map((d) => d.label)).toEqual(['car', 'dog', 'person']);
  });

  it('throws when the model predicts a class outside the labels array', async () => {
    register([0, 7, 2]);
    const detector = tracked(await createObjectDetector(config));

    await expect(detector.detectObjects(imageBuffer(MODEL_SIZE, MODEL_SIZE))).rejects.toThrow(
      /class index 7 is out of bounds.*size 3/s
    );
  });

  it('produces the same result synchronously and asynchronously', async () => {
    const detector = tracked(await createObjectDetector(config));
    const input = imageBuffer(MODEL_SIZE, MODEL_SIZE);

    expect(detector.detectObjectsWorklet(input)).toEqual(await detector.detectObjects(input));
  });
});

describe('createObjectDetector — letterboxing', () => {
  beforeEach(() => register());

  it('undoes the letterbox padding when scaling boxes back', async () => {
    const detector = tracked(
      await createObjectDetector({
        ...config,
        modelOpts: { ...options, resizeMode: 'letterbox' },
      })
    );

    // A 32x16 image letterboxed into a 16x16 input: scale 0.5, with 4px of
    // padding above and below. A box at y=1 in model space is therefore
    // above the image content and maps to a negative y.
    const [best] = await detector.detectObjects(imageBuffer(32, 16));

    expect(best!.box).toMatchObject({ format: 'xyxy', xmin: 2, xmax: 18 });
    expect((best!.box as { ymin: number }).ymin).toBeCloseTo(-6, 5);
  });
});

describe('createObjectDetector — model acceptance', () => {
  it('accepts the unbatched [3, H, W] variant', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(
        method('forward', [f32(3, MODEL_SIZE, MODEL_SIZE)], [f32(3, 4), f32(3), f32(3)])
      ),
      execute: writesOutputs(BOXES, SCORES, CLASSES),
    });

    const detector = tracked(await createObjectDetector(config));
    expect(await detector.detectObjects(imageBuffer(MODEL_SIZE, MODEL_SIZE))).toHaveLength(2);
  });

  it('rejects a model with the wrong number of outputs', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('forward', [f32(1, 3, MODEL_SIZE, MODEL_SIZE)], [f32(3, 4), f32(3)])),
    });

    await expect(createObjectDetector(config)).rejects.toThrow(/Output count mismatch/);
  });

  it('requires boxes, scores and classes to agree on the candidate count', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(
        method('forward', [f32(1, 3, MODEL_SIZE, MODEL_SIZE)], [f32(3, 4), f32(3), f32(5)])
      ),
    });

    await expect(createObjectDetector(config)).rejects.toThrow(/inconsistent bindings/);
  });
});

describe('createObjectDetector — lifetime', () => {
  beforeEach(() => register());

  it('releases every native resource on dispose', async () => {
    const detector = tracked(await createObjectDetector(config));
    await detector.detectObjects(imageBuffer(40, 30));

    detector.dispose();

    expect(fakeJsi.liveTensors()).toBe(0);
    expect(fakeJsi.liveModels()).toEqual([]);
  });
});
