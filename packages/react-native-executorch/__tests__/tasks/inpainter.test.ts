import { f32, method } from '../../src/core/schema';
import { createInpainter, type MaskBuffer } from '../../src/extensions/cv/tasks/inpainting';
import type { ImageBuffer } from '../../src/extensions/cv/image';
import { fakeJsi } from '../support/fakeJsi';
import type { FakeTensor } from '../support/fakeTensor';
import { tracked } from '../support/lifetime';
import { exported, imageBuffer, writesOutputs } from '../support/fixtures';

const MODEL_PATH = '/models/inpaint.pte';
const SIZE = 4;

/** The value the fake model paints, and the pixel it comes out as (0.2 * 255). */
const FILL = 0.2;
const FILL_PIXEL = 51;

const options = {
  interpolation: 'nearest',
  outInterpolation: 'nearest',
  blend: { shrink: 0, feather: 0 },
} as const;

const config = { modelPath: MODEL_PATH, modelOpts: options };

const BATCHED = method(
  'forward',
  [f32(1, 3, SIZE, SIZE), f32(1, 1, SIZE, SIZE)],
  [f32(1, 3, SIZE, SIZE)]
);

/** A model that paints every output pixel with `FILL`. */
const registerPainter = () => {
  fakeJsi.registerModel(MODEL_PATH, {
    schema: exported(BATCHED),
    execute: writesOutputs(new Array(3 * SIZE * SIZE).fill(FILL)),
  });
};

/**
 * A grayscale mask over a `width` x `height` image marking the `hole` rectangle
 * (inclusive corners) with 255.
 */
const maskBuffer = (
  width: number,
  height: number,
  hole: { x0: number; y0: number; x1: number; y1: number } | null
): MaskBuffer => {
  const data = new Uint8Array(width * height);
  if (hole) {
    for (let y = hole.y0; y <= hole.y1; y++) {
      for (let x = hole.x0; x <= hole.x1; x++) data[y * width + x] = 255;
    }
  }
  return { data, width, height, format: 'gray', layout: 'hwc' };
};

const rgbaAt = (output: ImageBuffer, x: number, y: number) => {
  const at = (y * output.width + x) * 4;
  return [...output.data.slice(at, at + 4)];
};

describe('createInpainter', () => {
  beforeEach(registerPainter);

  it('returns an opaque RGBA buffer at the input resolution', async () => {
    const inpainter = tracked(await createInpainter(config));

    const output = await inpainter.inpaint(
      imageBuffer(10, 6),
      maskBuffer(10, 6, { x0: 3, y0: 2, x1: 4, y1: 3 })
    );

    expect(output).toMatchObject({ width: 10, height: 6, format: 'rgba', layout: 'hwc' });
    expect(output.data).toHaveLength(10 * 6 * 4);
    expect([...output.data].filter((_, i) => i % 4 === 3).every((a) => a === 255)).toBe(true);
  });

  it('fills the hole with the model output and leaves the rest untouched', async () => {
    // The model paints the whole (downscaled) frame, so with nearest resizing
    // and a hard blend the hole takes the painted value exactly and every
    // other pixel is the input.
    const inpainter = tracked(await createInpainter(config));
    const input = imageBuffer(8, 8);
    const hole = { x0: 2, y0: 2, x1: 3, y1: 3 };

    const output = await inpainter.inpaint(input, maskBuffer(8, 8, hole));

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const inHole = x >= hole.x0 && x <= hole.x1 && y >= hole.y0 && y <= hole.y1;
        const at = (y * 8 + x) * 3;
        const original = [...input.data.slice(at, at + 3), 255];
        expect(rgbaAt(output, x, y)).toEqual(
          inHole ? [FILL_PIXEL, FILL_PIXEL, FILL_PIXEL, 255] : original
        );
      }
    }
  });

  it('feeds the model the whole frame resized to its input', async () => {
    let imageSeen: number[] = [];
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(BATCHED),
      execute: (_method, inputs) => {
        const image = inputs[0] as FakeTensor;
        imageSeen = Array.from({ length: image.numel }, (_, i) => image.getElement(i));
      },
    });
    const inpainter = tracked(await createInpainter(config));
    const input = imageBuffer(2 * SIZE, 2 * SIZE);

    // A hole in one corner still sends the model every part of the frame.
    await inpainter.inpaint(input, maskBuffer(2 * SIZE, 2 * SIZE, { x0: 0, y0: 0, x1: 0, y1: 0 }));

    // Nearest downscaling by 2 keeps every other pixel, laid out CHW in [0, 1].
    const expected: number[] = [];
    for (let c = 0; c < 3; c++) {
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          expected.push(input.data[(2 * y * 2 * SIZE + 2 * x) * 3 + c]! / 255);
        }
      }
    }
    expect(imageSeen).toHaveLength(expected.length);
    imageSeen.forEach((v, i) => expect(v).toBeCloseTo(expected[i]!, 5));
  });

  it('feeds the model 1 for known pixels and 0 for the hole', async () => {
    let maskSeen: number[] = [];
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(BATCHED),
      execute: (_method, inputs) => {
        const mask = inputs[1] as FakeTensor;
        maskSeen = Array.from({ length: mask.numel }, (_, i) => mask.getElement(i));
      },
    });
    const inpainter = tracked(await createInpainter(config));

    // Any non-zero mask value is the hole, however faint.
    const mask = maskBuffer(SIZE, SIZE, null);
    mask.data[1 * SIZE + 2] = 1;
    await inpainter.inpaint(imageBuffer(SIZE, SIZE), mask);

    const expected = new Array(SIZE * SIZE).fill(1);
    expected[1 * SIZE + 2] = 0;
    expect(maskSeen).toEqual(expected);
  });

  it('returns the input unchanged for an empty mask', async () => {
    const inpainter = tracked(await createInpainter(config));
    const input = imageBuffer(6, 5);

    const output = await inpainter.inpaint(input, maskBuffer(6, 5, null));

    for (let p = 0; p < 6 * 5; p++) {
      expect([...output.data.slice(p * 4, p * 4 + 3)]).toEqual([
        ...input.data.slice(p * 3, p * 3 + 3),
      ]);
    }
  });

  it('rejects a mask that is not a gray buffer', async () => {
    const inpainter = tracked(await createInpainter(config));
    const mask = imageBuffer(SIZE, SIZE, 'rgba') as unknown as MaskBuffer;

    await expect(inpainter.inpaint(imageBuffer(SIZE, SIZE), mask)).rejects.toMatchObject({
      code: 'INVALID_ARGUMENT',
    });
    expect(fakeJsi.executions()).toEqual([]);
  });

  it('accepts the unbatched [3, H, W] variant', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(
        method('forward', [f32(3, SIZE, SIZE), f32(1, SIZE, SIZE)], [f32(3, SIZE, SIZE)])
      ),
      execute: writesOutputs(new Array(3 * SIZE * SIZE).fill(FILL)),
    });
    const inpainter = tracked(await createInpainter(config));

    const output = await inpainter.inpaint(
      imageBuffer(SIZE, SIZE),
      maskBuffer(SIZE, SIZE, { x0: 0, y0: 0, x1: 0, y1: 0 })
    );

    expect(rgbaAt(output, 0, 0)).toEqual([FILL_PIXEL, FILL_PIXEL, FILL_PIXEL, 255]);
  });

  it('rejects a model whose mask input does not match the image input', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(
        method(
          'forward',
          [f32(1, 3, SIZE, SIZE), f32(1, 1, SIZE * 2, SIZE)],
          [f32(1, 3, SIZE, SIZE)]
        )
      ),
    });

    await expect(createInpainter(config)).rejects.toThrow(/inconsistent bindings/);
  });

  it('rejects a mask whose dimensions differ from the image', async () => {
    const inpainter = tracked(await createInpainter(config));

    await expect(
      inpainter.inpaint(imageBuffer(6, 6), maskBuffer(3, 3, { x0: 0, y0: 0, x1: 0, y1: 0 }))
    ).rejects.toThrow(/mask is 3x3 but image is 6x6/);
  });

  it('produces the same result synchronously and asynchronously', async () => {
    const inpainter = tracked(await createInpainter(config));
    const input = imageBuffer(8, 8);
    const mask = maskBuffer(8, 8, { x0: 2, y0: 2, x1: 3, y1: 3 });

    expect(inpainter.inpaintWorklet(input, mask)).toEqual(await inpainter.inpaint(input, mask));
  });

  it('releases every native resource on dispose', async () => {
    const inpainter = await createInpainter(config);
    await inpainter.inpaint(
      imageBuffer(20, 15),
      maskBuffer(20, 15, { x0: 5, y0: 5, x1: 8, y1: 9 })
    );

    inpainter.dispose();

    expect(fakeJsi.liveTensors()).toBe(0);
    expect(fakeJsi.liveModels()).toEqual([]);
  });

  it('frees the per-call tensors across repeated calls', async () => {
    const inpainter = tracked(await createInpainter(config));
    const afterConstruction = fakeJsi.liveTensors();

    for (const size of [8, 16, 32]) {
      await inpainter.inpaint(
        imageBuffer(size, size),
        maskBuffer(size, size, { x0: 1, y0: 1, x1: 2, y1: 2 })
      );
    }
    await inpainter.inpaint(imageBuffer(8, 8), maskBuffer(8, 8, null));

    expect(fakeJsi.liveTensors()).toBe(afterConstruction);
  });
});
