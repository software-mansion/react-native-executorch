import { IMAGENET_NORM } from '../../src/constants';
import { f32, i32, method } from '../../src/core/schema';
import { createDepthEstimator } from '../../src/extensions/cv/tasks/depthEstimation';
import { fakeJsi } from '../support/fakeJsi';
import { tracked } from '../support/lifetime';
import { exported, imageBuffer, writesOutputs } from '../support/fixtures';
import type { FakeTensor } from '../support/fakeTensor';

const MODEL_PATH = '/models/depth.pte';
const config = {
  modelPath: MODEL_PATH,
  modelOpts: {
    resizeMode: 'stretch',
    interpolation: 'cubic',
    normalizeOpts: IMAGENET_NORM,
    outInterpolation: 'linear',
  },
} as const;
const schema = exported(method('forward', [f32(1, 3, 2, 3)], [f32(1, 2, 3)]));

describe('createDepthEstimator', () => {
  beforeEach(() => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema,
      execute: writesOutputs([-1.25, 0.5, 2.75, 4, 10.125, 512.5]),
    });
  });

  it('preserves float values and row-major ordering without normalizing or clipping', async () => {
    const estimator = tracked(await createDepthEstimator(config));
    const result = await estimator.estimateDepth(imageBuffer(3, 2));

    expect(result).toEqual({
      width: 3,
      height: 2,
      data: Float32Array.from([-1.25, 0.5, 2.75, 4, 10.125, 512.5]),
    });
  });

  it('restores a constant depth field to portrait and landscape source dimensions', async () => {
    fakeJsi.registerModel(MODEL_PATH, { schema, execute: writesOutputs(Array(6).fill(12.25)) });
    const estimator = tracked(await createDepthEstimator(config));
    for (const [width, height] of [
      [8, 4],
      [4, 8],
    ]) {
      const result = await estimator.estimateDepth(imageBuffer(width!, height!));
      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
      expect([...result.data]).toEqual(Array(width! * height!).fill(12.25));
    }
  });

  it('converts RGBA to RGB channels-first with ImageNet normalization', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema,
      execute: (_method, inputs) => {
        const input = inputs[0] as FakeTensor;
        const means = [0.485, 0.456, 0.406];
        const deviations = [0.229, 0.224, 0.225];
        const pixels = [255, 128, 0];
        for (let channel = 0; channel < 3; channel++) {
          for (let pixel = 0; pixel < 6; pixel++) {
            expect(input.getElement(channel * 6 + pixel)).toBeCloseTo(
              (pixels[channel]! / 255 - means[channel]!) / deviations[channel]!,
              5
            );
          }
        }
      },
    });
    const estimator = tracked(await createDepthEstimator(config));
    await estimator.estimateDepth({
      data: Uint8Array.from(Array(6).fill([255, 128, 0, 64]).flat()),
      width: 3,
      height: 2,
      format: 'rgba',
      layout: 'hwc',
    });
  });

  it('owns each result buffer across subsequent calls and disposal', async () => {
    let call = 0;
    fakeJsi.registerModel(MODEL_PATH, {
      schema,
      execute: (_method, _inputs, outputs) => {
        outputs[0]!.setElement(0, ++call);
      },
    });
    const estimator = tracked(await createDepthEstimator(config));
    const first = await estimator.estimateDepth(imageBuffer(3, 2));
    const second = estimator.estimateDepthWorklet(imageBuffer(3, 2));
    expect(first.data).not.toBe(second.data);
    second.data[0] = 99;
    estimator.dispose();
    expect(first.data[0]).toBe(1);
  });

  it('agrees between asynchronous and synchronous entry points', async () => {
    const estimator = tracked(await createDepthEstimator(config));
    const input = imageBuffer(3, 2);
    expect(await estimator.estimateDepth(input)).toEqual(estimator.estimateDepthWorklet(input));
  });

  it.each([
    { input: [1, 3, 4, 6], output: [1, 2, 3] },
    { input: [3, 4, 6], output: [2, 3] },
  ])('accepts input $input and lower-resolution output $output', async ({ input, output }) => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('forward', [f32(...input)], [f32(...output)])),
      execute: writesOutputs(Array(6).fill(7.25)),
    });
    const estimator = tracked(await createDepthEstimator(config));
    const result = await estimator.estimateDepth(imageBuffer(12, 8));
    expect(result.width).toBe(12);
    expect(result.height).toBe(8);
    expect([...result.data]).toEqual(Array(96).fill(7.25));
  });

  it('uses model-specific normalization instead of assuming ImageNet inputs', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema,
      execute: (_method, inputs) => {
        const input = inputs[0] as FakeTensor;
        expect(input.getElement(0)).toBeCloseTo(255 / 127.5 - 1);
        expect(input.getElement(6)).toBeCloseTo(128 / 127.5 - 1);
        expect(input.getElement(12)).toBeCloseTo(-1);
      },
    });
    const estimator = tracked(
      await createDepthEstimator({
        ...config,
        modelOpts: {
          resizeMode: 'stretch',
          interpolation: 'nearest',
          normalizeOpts: { alpha: 1 / 127.5, beta: -1 },
          outInterpolation: 'nearest',
        },
      })
    );
    await estimator.estimateDepth({
      data: Uint8Array.from(Array(6).fill([255, 128, 0]).flat()),
      width: 3,
      height: 2,
      format: 'rgb',
      layout: 'hwc',
    });
  });

  it.each([[f32(1, 1, 2, 3)], [f32(1, 2, 2, 3)], [i32(1, 2, 3)], [f32(2, 2, 3)]])(
    'rejects incompatible depth output %j and releases the model',
    async (output) => {
      fakeJsi.registerModel(MODEL_PATH, {
        schema: exported(method('forward', [f32(1, 3, 2, 3)], [output])),
      });
      await expect(createDepthEstimator(config)).rejects.toMatchObject({ code: 'SCHEMA_MISMATCH' });
      expect(fakeJsi.liveModels()).toEqual([]);
      expect(fakeJsi.liveTensors()).toBe(0);
    }
  );

  it('releases per-call tensors and all resources on repeated disposal', async () => {
    const estimator = tracked(await createDepthEstimator(config));
    const initialTensors = fakeJsi.liveTensors();
    for (const size of [4, 8, 16]) {
      await estimator.estimateDepth(imageBuffer(size, size));
      expect(fakeJsi.liveTensors()).toBe(initialTensors);
    }
    estimator.dispose();
    estimator.dispose();
    expect(fakeJsi.liveTensors()).toBe(0);
    expect(fakeJsi.liveModels()).toEqual([]);
  });

  it('releases transient preprocessing tensors when inference fails', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema,
      execute: () => {
        throw new Error('Inference failed');
      },
    });
    const estimator = tracked(await createDepthEstimator(config));
    const initialTensors = fakeJsi.liveTensors();
    await expect(estimator.estimateDepth(imageBuffer(8, 4))).rejects.toThrow('Inference failed');
    expect(fakeJsi.liveTensors()).toBe(initialTensors);
  });
});
