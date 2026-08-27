import { f32, method } from '../../src/core/schema';
import { createSemanticSegmenter } from '../../src/extensions/cv/tasks/semanticSegmentation';
import { fakeJsi } from '../support/fakeJsi';
import { tracked } from '../support/lifetime';
import { STRETCH_PREPROCESSING, exported, imageBuffer, writesOutputs } from '../support/fixtures';
import { allowNativeLeaks } from '../support/setup';

const MODEL_PATH = '/models/segmenter.pte';
const LABELS = ['background', 'person', 'cat'] as const;
const SIZE = 2;

const options = {
  ...STRETCH_PREPROCESSING,
  resizeMode: 'stretch',
  outInterpolation: 'nearest',
  labels: LABELS,
} as const;

const config = { modelPath: MODEL_PATH, modelOpts: options };

/**
 * Per-class logits for a 2x2 image in CHW order. Class 1 wins the top-left
 * pixel, class 2 the next, and class 0 the bottom row.
 */
const LOGITS = [
  // class 0
  0, 0, 9, 9,
  // class 1
  9, 0, 0, 0,
  // class 2
  0, 9, 0, 0,
];

const registerMultiClass = () => {
  fakeJsi.registerModel(MODEL_PATH, {
    schema: exported(
      method('forward', [f32(1, 3, SIZE, SIZE)], [f32(1, LABELS.length, SIZE, SIZE)])
    ),
    execute: writesOutputs(LOGITS),
  });
};

/**
 * Reads the RGBA pixel at (x, y) from a segmentation result buffer.
 */
const pixelAt = (data: Uint8Array, width: number, x: number, y: number): number[] => [
  ...data.slice((y * width + x) * 4, (y * width + x) * 4 + 4),
];

describe('createSemanticSegmenter — multi-class models', () => {
  beforeEach(registerMultiClass);

  it('rejects a labels array that does not match the class dimension', async () => {
    await expect(
      createSemanticSegmenter({ ...config, modelOpts: { ...options, labels: ['only-one'] } })
    ).rejects.toThrow(/Model outputs 3 classes, but 1 labels were provided/);
    allowNativeLeaks(); // see `tasks/constructionFailure.test.ts`
  });

  it('returns an RGBA mask at the input image resolution', async () => {
    const segmenter = tracked(await createSemanticSegmenter(config));

    const { buffer } = await segmenter.segment(imageBuffer(8, 6));

    expect(buffer).toMatchObject({ width: 8, height: 6, format: 'rgba', layout: 'hwc' });
    expect(buffer.data).toHaveLength(8 * 6 * 4);
  });

  it('colors each pixel by its argmax class', async () => {
    const segmenter = tracked(await createSemanticSegmenter(config));

    const { buffer, colormap } = await segmenter.segment(imageBuffer(SIZE, SIZE));

    expect(pixelAt(buffer.data, SIZE, 0, 0)).toEqual(colormap!.person);
    expect(pixelAt(buffer.data, SIZE, 1, 0)).toEqual(colormap!.cat);
    expect(pixelAt(buffer.data, SIZE, 0, 1)).toEqual(colormap!.background);
  });

  it('generates a default colormap with a transparent first class', async () => {
    const segmenter = tracked(await createSemanticSegmenter(config));

    const { colormap } = await segmenter.segment(imageBuffer(SIZE, SIZE));

    expect(Object.keys(colormap!).sort()).toEqual([...LABELS].sort());
    expect(colormap!.background).toEqual([0, 0, 0, 0]);
    expect(colormap!.person).not.toEqual(colormap!.cat);
    expect(colormap!.person[3]).toBe(255);
  });

  it('uses an explicit colormap when one is given', async () => {
    const segmenter = tracked(await createSemanticSegmenter(config));

    const { buffer, colormap } = await segmenter.segment(imageBuffer(SIZE, SIZE), {
      person: [10, 20, 30, 255],
    });

    expect(colormap!.person).toEqual([10, 20, 30, 255]);
    expect(pixelAt(buffer.data, SIZE, 0, 0)).toEqual([10, 20, 30, 255]);
  });

  it('renders labels omitted from a partial colormap as transparent', async () => {
    const segmenter = tracked(await createSemanticSegmenter(config));

    const { buffer, colormap } = await segmenter.segment(imageBuffer(SIZE, SIZE), {
      person: [10, 20, 30, 255],
    });

    expect(colormap!.cat).toEqual([0, 0, 0, 0]);
    expect(pixelAt(buffer.data, SIZE, 1, 0)).toEqual([0, 0, 0, 0]);
  });
});

describe('createSemanticSegmenter — single-class models', () => {
  beforeEach(() => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('forward', [f32(1, 3, SIZE, SIZE)], [f32(1, 1, SIZE, SIZE)])),
      // Logits spanning the sigmoid range: strongly negative to strongly positive.
      execute: writesOutputs([-10, 0, 10, 10]),
    });
  });

  it('does not require the labels array to match', async () => {
    const segmenter = tracked(
      await createSemanticSegmenter({ ...config, modelOpts: { ...options, labels: ['fg'] } })
    );
    expect(segmenter.segment).toBeInstanceOf(Function);
  });

  it('returns no colormap — the mask is a grayscale probability', async () => {
    const segmenter = tracked(await createSemanticSegmenter(config));

    const { colormap } = await segmenter.segment(imageBuffer(SIZE, SIZE));

    expect(colormap).toBeUndefined();
  });

  it('maps the sigmoid probability onto the 0-255 grayscale range', async () => {
    const segmenter = tracked(await createSemanticSegmenter(config));

    const { buffer } = await segmenter.segment(imageBuffer(SIZE, SIZE));

    // sigmoid(-10) ~ 0, sigmoid(0) = 0.5, sigmoid(10) ~ 1.
    expect(pixelAt(buffer.data, SIZE, 0, 0).slice(0, 3)).toEqual([0, 0, 0]);
    expect(pixelAt(buffer.data, SIZE, 1, 0).slice(0, 3)).toEqual([128, 128, 128]);
    expect(pixelAt(buffer.data, SIZE, 0, 1).slice(0, 3)).toEqual([255, 255, 255]);
  });

  it('writes an opaque alpha channel', async () => {
    const segmenter = tracked(await createSemanticSegmenter(config));

    const { buffer } = await segmenter.segment(imageBuffer(SIZE, SIZE));

    expect(pixelAt(buffer.data, SIZE, 0, 0)[3]).toBe(255);
  });
});

describe('createSemanticSegmenter — lifetime', () => {
  beforeEach(registerMultiClass);

  it('releases every native resource on dispose', async () => {
    const segmenter = await createSemanticSegmenter(config);
    await segmenter.segment(imageBuffer(12, 9));

    segmenter.dispose();

    expect(fakeJsi.liveTensors()).toBe(0);
    expect(fakeJsi.liveModels()).toEqual([]);
  });

  it('frees the per-call resize tensor', async () => {
    const segmenter = tracked(await createSemanticSegmenter(config));
    const afterConstruction = fakeJsi.liveTensors();

    await segmenter.segment(imageBuffer(12, 9));
    await segmenter.segment(imageBuffer(20, 20));

    expect(fakeJsi.liveTensors()).toBe(afterConstruction);
  });
});
