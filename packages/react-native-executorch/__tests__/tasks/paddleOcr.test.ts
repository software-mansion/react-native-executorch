/**
 * The PP-OCRv6 optical character recognition pipeline.
 *
 * One `.pte` exporting two methods, run in sequence: `detect` produces a DBNet
 * probability map that is decoded into oriented quads, and `recognize` reads
 * each quad through a CTC head. What is contract rather than weights — the two
 * signatures and the `W = 8 * T` relation between them, the charset having to
 * match the recognizer's vocabulary, the CTC collapse, the confidence filter,
 * the reading order the detections come back in, and the tensors every quad
 * allocates and frees — is what this suite covers.
 *
 * The fake decoder finds connected regions of the probability map, so a test
 * paints the map it wants detections from rather than stubbing the decode.
 */
import { RangeDim, constraint, f32, method } from '../../src/core/schema';
import { createPaddleOcr } from '../../src/extensions/cv/tasks/paddleOcr';
import type { ImageBuffer } from '../../src/extensions/cv/image';
import { fakeJsi } from '../support/fakeJsi';
import { fakeFs } from '../support/blobUtilMock';
import { exported } from '../support/fixtures';
import { tracked } from '../support/lifetime';

const MODEL_PATH = '/models/paddle_ocr.pte';
const CHARSET_PATH = '/models/charset.json';

// Fixed by the export: SVTR reduces the recognizer width onto the CTC time axis
// by exactly 8, which the spec asserts as a runtime constraint.
const CTC_STRIDE = 8;
const REC_HEIGHT = 8;
const CHARSET = ['a', 'b', 'c'];
const VOCAB = CHARSET.length + 1; // plus the CTC blank at index 0

const DET_SIZES = RangeDim(16, 64, 16);
const REC_WIDTHS = RangeDim(CTC_STRIDE, CTC_STRIDE * 8, CTC_STRIDE);

const schema = (vocab = VOCAB) =>
  exported({
    ...method('detect', [f32(1, 3, DET_SIZES, DET_SIZES)], [f32(1, 1, DET_SIZES, DET_SIZES)]),
    ...method(
      'recognize',
      [f32(1, 3, REC_HEIGHT, REC_WIDTHS)],
      [f32(1, RangeDim(1, 8), vocab)],
      [
        constraint.linear(
          { paramSide: 'input', tensorIdx: 0, dimIdx: 3 },
          { paramSide: 'output', tensorIdx: 0, dimIdx: 1 },
          CTC_STRIDE
        ),
      ]
    ),
  });

/** A plain white RGB page, so the detector's input is well defined. */
const page = (width = 32, height = 32): ImageBuffer => ({
  data: new Uint8Array(width * height * 3).fill(255),
  width,
  height,
  format: 'rgb',
  layout: 'hwc',
});

type Region = { x0: number; y0: number; x1: number; y1: number };

/**
 * Builds an `execute` for the fused model: `detect` paints `regions` into the
 * probability map, and `recognize` emits the CTC logits for the next scripted
 * word, one word per call in order.
 * @param regions Rectangles of the probability map to mark as text.
 * @param words The text each recognized region decodes to, in order.
 * @param confidence Peak probability written for a recognized character.
 * @returns The execute implementation.
 */
const detectsAndReads = (regions: Region[], words: string[], confidence = 0.9) => {
  let recognizeCall = 0;
  return (
    methodName: string,
    _inputs: readonly unknown[],
    outputs: readonly {
      numel: number;
      shape: readonly number[];
      setElement: (i: number, v: number) => void;
    }[]
  ) => {
    const output = outputs[0]!;
    if (methodName === 'detect') {
      const width = output.shape[3]!;
      for (let i = 0; i < output.numel; i++) output.setElement(i, 0);
      for (const { x0, y0, x1, y1 } of regions) {
        for (let y = y0; y <= y1; y++) {
          for (let x = x0; x <= x1; x++) output.setElement(y * width + x, 1);
        }
      }
      return;
    }

    // `recognize`: [1, timesteps, vocab]. Each character takes one timestep,
    // the rest stay on the blank, so the greedy CTC collapse reproduces the
    // word exactly.
    const [, timesteps, vocab] = output.shape as [number, number, number];
    const word = words[Math.min(recognizeCall, words.length - 1)] ?? '';
    recognizeCall++;
    for (let t = 0; t < timesteps; t++) {
      const character = word[t];
      const index = character === undefined ? 0 : CHARSET.indexOf(character) + 1;
      for (let v = 0; v < vocab; v++) {
        output.setElement(t * vocab + v, v === index ? confidence : 0);
      }
    }
  };
};

const config = {
  modelPath: MODEL_PATH,
  charsetPath: CHARSET_PATH,
  modelOpts: { defaultConfidenceThreshold: 0.5 },
};

const register = (regions: Region[], words: string[], confidence?: number) =>
  fakeJsi.registerModel(MODEL_PATH, {
    schema: schema(),
    execute: detectsAndReads(regions, words, confidence),
  });

beforeEach(() => {
  fakeFs.write(CHARSET_PATH, JSON.stringify(CHARSET));
  register([{ x0: 2, y0: 6, x1: 26, y1: 9 }], ['abc']);
});

describe('createPaddleOcr — the model contract', () => {
  it('accepts the fused detect/recognize export', async () => {
    const ocr = tracked(await createPaddleOcr(config));

    expect(ocr.recognizeCharacters).toBeInstanceOf(Function);
    expect(ocr.recognizeCharactersWorklet).toBeInstanceOf(Function);
  });

  it('rejects an export missing the recognize method', async () => {
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported(
        method('detect', [f32(1, 3, DET_SIZES, DET_SIZES)], [f32(1, 1, DET_SIZES, DET_SIZES)])
      ),
    });

    await expect(createPaddleOcr(config)).rejects.toThrow(/recognize/);
  });

  it('rejects a recognizer whose width is not 8x its CTC time axis', async () => {
    // The pipeline pre-allocates the probability tensor from the input width,
    // so a model with a different stride would silently mis-shape every read.
    fakeJsi.registerModel(MODEL_PATH, {
      schema: exported({
        ...method('detect', [f32(1, 3, DET_SIZES, DET_SIZES)], [f32(1, 1, DET_SIZES, DET_SIZES)]),
        ...method(
          'recognize',
          [f32(1, 3, REC_HEIGHT, REC_WIDTHS)],
          [f32(1, RangeDim(1, 8), VOCAB)]
        ),
      }),
    });

    await expect(createPaddleOcr(config)).rejects.toThrow(/constraint/i);
  });

  it('rejects a charset that does not cover the recognizer vocabulary', async () => {
    fakeFs.write(CHARSET_PATH, JSON.stringify([...CHARSET, 'd']));

    await expect(createPaddleOcr(config)).rejects.toThrow(/charset size/);
  });

  it('surfaces a missing charset file', async () => {
    fakeFs.remove(CHARSET_PATH);

    await expect(createPaddleOcr(config)).rejects.toThrow(/ENOENT/);
  });

  it('releases the model on dispose', async () => {
    const ocr = await createPaddleOcr(config);

    ocr.dispose();

    expect(fakeJsi.liveModels()).toEqual([]);
    expect(fakeJsi.liveTensors()).toBe(0);
  });
});

describe('createPaddleOcr — recognition', () => {
  it('reads a detected region and reports its text and quad', async () => {
    const ocr = tracked(await createPaddleOcr(config));

    const [detection, ...rest] = await ocr.recognizeCharacters(page());

    expect(rest).toEqual([]);
    expect(detection!.text).toBe('abc');
    expect(detection!.confidence).toBeCloseTo(0.9);
    expect(detection!.quad).toHaveLength(4);
  });

  it('runs detect once and recognize once per region', async () => {
    register(
      [
        { x0: 2, y0: 2, x1: 10, y1: 6 },
        { x0: 2, y0: 16, x1: 10, y1: 20 },
      ],
      ['ab', 'ca']
    );
    const ocr = tracked(await createPaddleOcr(config));

    await ocr.recognizeCharacters(page());

    expect(fakeJsi.executions().map(({ methodName }) => methodName)).toEqual([
      'detect',
      'recognize',
      'recognize',
    ]);
  });

  it('returns the regions in reading order, top to bottom', async () => {
    register(
      [
        { x0: 2, y0: 18, x1: 12, y1: 24 },
        { x0: 2, y0: 2, x1: 12, y1: 8 },
      ],
      ['ab', 'ca']
    );
    const ocr = tracked(await createPaddleOcr(config));

    const detections = await ocr.recognizeCharacters(page());

    // The decoder walks the map top-down, so the upper region is recognized
    // first; what matters is that the result is ordered by position either way.
    const tops = detections.map((detection) => Math.min(...detection.quad.map((p) => p.y)));
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
  });

  it('finds nothing on a page the detector leaves blank', async () => {
    register([], []);
    const ocr = tracked(await createPaddleOcr(config));

    expect(await ocr.recognizeCharacters(page())).toEqual([]);
  });

  it('collapses a CTC run of the same character to one glyph', async () => {
    // The recognizer emits `a` on every timestep; the decode has to yield 'a',
    // not one character per timestep.
    fakeJsi.registerModel(MODEL_PATH, {
      schema: schema(),
      execute: (methodName, inputs, outputs) => {
        if (methodName === 'detect') {
          detectsAndReads([{ x0: 2, y0: 6, x1: 26, y1: 9 }], [])(methodName, inputs, outputs);
          return;
        }
        const output = outputs[0]!;
        const [, timesteps, vocab] = output.shape as [number, number, number];
        for (let t = 0; t < timesteps; t++) {
          for (let v = 0; v < vocab; v++) output.setElement(t * vocab + v, v === 1 ? 0.9 : 0);
        }
      },
    });
    const ocr = tracked(await createPaddleOcr(config));

    expect((await ocr.recognizeCharacters(page()))[0]!.text).toBe('a');
  });

  it('drops a region whose confidence is below the model default', async () => {
    register([{ x0: 2, y0: 6, x1: 26, y1: 9 }], ['abc'], 0.2);
    const ocr = tracked(await createPaddleOcr(config));

    expect(await ocr.recognizeCharacters(page())).toEqual([]);
  });

  it('lets a call override the model confidence threshold', async () => {
    register([{ x0: 2, y0: 6, x1: 26, y1: 9 }], ['abc'], 0.2);
    const ocr = tracked(await createPaddleOcr(config));

    const detections = await ocr.recognizeCharacters(page(), { confidenceThreshold: 0.1 });

    expect(detections.map((detection) => detection.text)).toEqual(['abc']);
  });

  it('reports quads in original image pixels, not detector pixels', async () => {
    // A page larger than the detector's widest input is scaled down before
    // detection; the quads have to come back mapped into the page's own space.
    register([{ x0: 4, y0: 4, x1: 20, y1: 12 }], ['abc']);
    const ocr = tracked(await createPaddleOcr(config));

    const [detection] = await ocr.recognizeCharacters(page(256, 256));

    const xs = detection!.quad.map((p) => p.x);
    expect(Math.max(...xs)).toBeGreaterThan(64); // beyond any detector-space coordinate
    expect(Math.max(...xs)).toBeLessThanOrEqual(256);
  });

  it('runs synchronously on the caller thread through the worklet variant', async () => {
    const ocr = tracked(await createPaddleOcr(config));

    expect(ocr.recognizeCharactersWorklet(page())[0]!.text).toBe('abc');
  });

  it('frees every per-call tensor, however many regions were found', async () => {
    register(
      [
        { x0: 2, y0: 2, x1: 10, y1: 6 },
        { x0: 2, y0: 16, x1: 10, y1: 20 },
      ],
      ['ab', 'ca']
    );
    const ocr = tracked(await createPaddleOcr(config));

    await ocr.recognizeCharacters(page());

    // The pipeline holds nothing between calls: the model is the only resource.
    expect(fakeJsi.liveTensors()).toBe(0);
  });
});
