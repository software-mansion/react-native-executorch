/**
 * The extension helpers that are pure TypeScript.
 *
 * Box and point scaling, box decoding and the seeded generators run entirely in
 * JS — no native call, no model — so they are exactly as correct as this suite
 * says they are. Coordinate transforms in particular fail quietly: an
 * off-by-half in the letterbox offset shifts every detection by a few pixels,
 * which looks plausible in a demo and wrong in production.
 */
import { mulberry32, randomNormal } from '../../src/extensions/math';
import { decodeBox, scaleBox } from '../../src/extensions/cv/ops/box';
import { scalePoint } from '../../src/extensions/cv/ops/point';
import { FORMAT_CHANNELS, FORMAT_CONVERSION } from '../../src/extensions/cv/ops/image';

describe('decodeBox', () => {
  it('reads an xyxy tuple as two corners', () => {
    expect(decodeBox([1, 2, 3, 4], 'xyxy')).toEqual({
      format: 'xyxy',
      xmin: 1,
      ymin: 2,
      xmax: 3,
      ymax: 4,
    });
  });

  it('reads an xywh tuple as a corner plus a size', () => {
    expect(decodeBox([1, 2, 3, 4], 'xywh')).toEqual({
      format: 'xywh',
      xmin: 1,
      ymin: 2,
      w: 3,
      h: 4,
    });
  });

  it('reads a cxcywh tuple as a centre plus a size', () => {
    expect(decodeBox([1, 2, 3, 4], 'cxcywh')).toEqual({
      format: 'cxcywh',
      cx: 1,
      cy: 2,
      w: 3,
      h: 4,
    });
  });
});

describe('scalePoint', () => {
  const from = { width: 100, height: 100 };

  it('is the identity when the resolutions match', () => {
    expect(scalePoint({ x: 10, y: 20 }, { from, to: from, resizeMode: 'stretch' })).toEqual({
      x: 10,
      y: 20,
    });
  });

  it('scales each axis independently when stretching', () => {
    const to = { width: 200, height: 50 };
    expect(scalePoint({ x: 10, y: 10 }, { from, to, resizeMode: 'stretch' })).toEqual({
      x: 20,
      y: 5,
    });
  });

  it('removes the letterbox padding before scaling', () => {
    // A 200x100 image into a 100x100 input: scale 0.5, 25px of padding top and
    // bottom. The centre of the model input is the centre of the image.
    const to = { width: 200, height: 100 };
    expect(scalePoint({ x: 50, y: 50 }, { from, to, resizeMode: 'letterbox' })).toEqual({
      x: 100,
      y: 50,
    });
  });

  it('maps a point inside the letterbox padding to outside the image', () => {
    const to = { width: 200, height: 100 };
    expect(scalePoint({ x: 0, y: 0 }, { from, to, resizeMode: 'letterbox' }).y).toBeLessThan(0);
  });

  it('round-trips the corners of a letterboxed image', () => {
    const to = { width: 200, height: 100 };
    const opts = { from, to, resizeMode: 'letterbox' } as const;

    expect(scalePoint({ x: 0, y: 25 }, opts)).toEqual({ x: 0, y: 0 });
    expect(scalePoint({ x: 100, y: 75 }, opts)).toEqual({ x: 200, y: 100 });
  });
});

describe('scaleBox', () => {
  const from = { width: 100, height: 100 };
  const to = { width: 200, height: 100 };

  it('scales both corners of an xyxy box when stretching', () => {
    const box = decodeBox([10, 10, 20, 20], 'xyxy');
    expect(scaleBox(box, { from, to, resizeMode: 'stretch' })).toEqual({
      format: 'xyxy',
      xmin: 20,
      ymin: 10,
      xmax: 40,
      ymax: 20,
    });
  });

  it('scales the origin and the extent of an xywh box', () => {
    const box = decodeBox([10, 10, 20, 20], 'xywh');
    expect(scaleBox(box, { from, to, resizeMode: 'stretch' })).toEqual({
      format: 'xywh',
      xmin: 20,
      ymin: 10,
      w: 40,
      h: 20,
    });
  });

  it('scales the centre and the extent of a cxcywh box', () => {
    const box = decodeBox([50, 50, 20, 20], 'cxcywh');
    expect(scaleBox(box, { from, to, resizeMode: 'stretch' })).toEqual({
      format: 'cxcywh',
      cx: 100,
      cy: 50,
      w: 40,
      h: 20,
    });
  });

  it('keeps the aspect ratio of a letterboxed box', () => {
    const box = decodeBox([0, 25, 100, 75], 'xyxy');
    expect(scaleBox(box, { from, to, resizeMode: 'letterbox' })).toEqual({
      format: 'xyxy',
      xmin: 0,
      ymin: 0,
      xmax: 200,
      ymax: 100,
    });
  });

  it('preserves the box format it was given', () => {
    for (const format of ['xyxy', 'xywh', 'cxcywh'] as const) {
      const scaled = scaleBox(decodeBox([1, 2, 3, 4], format), {
        from,
        to,
        resizeMode: 'stretch',
      });
      expect(scaled.format).toBe(format);
    }
  });
});

describe('mulberry32', () => {
  it('produces the same sequence for the same seed', () => {
    const first = Array.from({ length: 8 }, mulberry32(42));
    const second = Array.from({ length: 8 }, mulberry32(42));
    expect(first).toEqual(second);
  });

  it('produces a different sequence for a different seed', () => {
    expect(Array.from({ length: 8 }, mulberry32(1))).not.toEqual(
      Array.from({ length: 8 }, mulberry32(2))
    );
  });

  it('stays within [0, 1)', () => {
    const next = mulberry32(7);
    for (let i = 0; i < 2000; i++) {
      const value = next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('does not immediately repeat', () => {
    const next = mulberry32(0);
    const values = Array.from({ length: 100 }, next);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('randomNormal', () => {
  it('returns a Float32Array of the requested length', () => {
    const values = randomNormal(5, { seed: 1 });
    expect(values).toBeInstanceOf(Float32Array);
    expect(values).toHaveLength(5);
  });

  it('fills an odd length completely — the transform emits values in pairs', () => {
    const values = randomNormal(7, { seed: 3 });
    expect([...values].every(Number.isFinite)).toBe(true);
    expect(values[6]).not.toBe(0);
  });

  it('reproduces its sequence from a seed', () => {
    expect([...randomNormal(16, { seed: 99 })]).toEqual([...randomNormal(16, { seed: 99 })]);
  });

  it('approximates the requested mean and standard deviation', () => {
    const size = 20000;
    const values = randomNormal(size, { mean: 5, std: 2, seed: 12345 });

    const mean = [...values].reduce((sum, v) => sum + v, 0) / size;
    const variance = [...values].reduce((sum, v) => sum + (v - mean) ** 2, 0) / size;

    expect(mean).toBeCloseTo(5, 1);
    expect(Math.sqrt(variance)).toBeCloseTo(2, 1);
  });

  it('defaults to a standard normal', () => {
    const values = randomNormal(20000, { seed: 7 });
    const mean = [...values].reduce((sum, v) => sum + v, 0) / values.length;
    expect(mean).toBeCloseTo(0, 1);
  });

  it('draws different values on successive unseeded calls', () => {
    // The seed defaults to a timestamp, so two calls must not agree.
    expect([...randomNormal(8)]).not.toEqual([...randomNormal(8)]);
  });
});

describe('image format tables', () => {
  const formats = ['rgb', 'bgr', 'rgba', 'bgra', 'gray'] as const;

  it.each(formats)('%s has a channel count', (format) => {
    expect(FORMAT_CHANNELS[format]).toBeGreaterThan(0);
  });

  it('gives every format a conversion to every other format', () => {
    for (const from of formats) {
      for (const to of formats) {
        const code = FORMAT_CONVERSION[from][to];
        if (from === to) expect(code).toBeNull();
        else expect(code).toBe(`${from.toUpperCase()}2${to.toUpperCase()}`);
      }
    }
  });

  it('agrees with the channel counts implied by the format names', () => {
    expect(FORMAT_CHANNELS).toEqual({ rgb: 3, bgr: 3, rgba: 4, bgra: 4, gray: 1 });
  });
});
