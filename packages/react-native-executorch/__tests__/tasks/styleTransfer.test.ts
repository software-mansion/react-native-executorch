import { f32, method } from '../../src/core/schema';
import { createStyleTransfer } from '../../src/extensions/cv/tasks/styleTransfer';
import { fakeJsi } from '../support/fakeJsi';
import { tracked } from '../support/lifetime';
import {
  STRETCH_PREPROCESSING,
  copiesInputToOutput,
  exported,
  imageBuffer,
} from '../support/fixtures';

const MODEL_PATH = '/models/style.pte';
const SIZE = 4;

const options = {
  ...STRETCH_PREPROCESSING,
  resizeMode: 'stretch',
  outNormalizeOpts: { alpha: 255, beta: 0 },
  outInterpolation: 'nearest',
} as const;

const config = { modelPath: MODEL_PATH, modelOpts: options };

/** An identity model: whatever preprocessing produced comes straight back. */
const registerIdentity = () => {
  fakeJsi.registerModel(MODEL_PATH, {
    schema: exported(method('forward', [f32(1, 3, SIZE, SIZE)], [f32(1, 3, SIZE, SIZE)])),
    execute: copiesInputToOutput(),
  });
};

describe('createStyleTransfer', () => {
  beforeEach(registerIdentity);

  it('returns an opaque RGBA buffer at the input resolution', async () => {
    const transfer = tracked(await createStyleTransfer(config));

    const output = await transfer.transferStyle(imageBuffer(10, 6));

    expect(output).toMatchObject({ width: 10, height: 6, format: 'rgba', layout: 'hwc' });
    expect(output.data).toHaveLength(10 * 6 * 4);
    expect([...output.data].filter((_, i) => i % 4 === 3).every((a) => a === 255)).toBe(true);
  });

  it('round-trips pixel values through normalization and back', async () => {
    // The preprocessor divides by 255 and `outNormalizeOpts` multiplies by 255,
    // so an identity model must reproduce the input pixels exactly.
    const transfer = tracked(await createStyleTransfer(config));
    const input = imageBuffer(SIZE, SIZE);

    const output = await transfer.transferStyle(input);

    const rgbOf = (data: Uint8Array, stride: number, index: number) => [
      ...data.slice(index * stride, index * stride + 3),
    ];
    for (let pixel = 0; pixel < SIZE * SIZE; pixel++) {
      expect(rgbOf(output.data, 4, pixel)).toEqual(rgbOf(input.data, 3, pixel));
    }
  });

  it('accepts the unbatched [3, H, W] variant', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('forward', [f32(3, SIZE, SIZE)], [f32(3, SIZE, SIZE)])),
      execute: copiesInputToOutput(),
    });

    const transfer = tracked(await createStyleTransfer(config));
    expect((await transfer.transferStyle(imageBuffer(SIZE, SIZE))).data).toHaveLength(
      SIZE * SIZE * 4
    );
  });

  it('rejects a model whose output shape differs from its input shape', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(method('forward', [f32(1, 3, SIZE, SIZE)], [f32(1, 3, SIZE * 2, SIZE)])),
    });

    await expect(createStyleTransfer(config)).rejects.toThrow(/inconsistent bindings/);
  });

  it('produces the same result synchronously and asynchronously', async () => {
    const transfer = tracked(await createStyleTransfer(config));
    const input = imageBuffer(SIZE, SIZE);

    expect(transfer.transferStyleWorklet(input)).toEqual(await transfer.transferStyle(input));
  });

  it('releases every native resource on dispose', async () => {
    const transfer = await createStyleTransfer(config);
    await transfer.transferStyle(imageBuffer(20, 15));

    transfer.dispose();

    expect(fakeJsi.liveTensors()).toBe(0);
    expect(fakeJsi.liveModels()).toEqual([]);
  });

  it('frees the per-call resize tensor across repeated calls', async () => {
    const transfer = tracked(await createStyleTransfer(config));
    const afterConstruction = fakeJsi.liveTensors();

    for (const size of [8, 16, 32]) await transfer.transferStyle(imageBuffer(size, size));

    expect(fakeJsi.liveTensors()).toBe(afterConstruction);
  });
});
