/**
 * The Reverb backbone adapter on the fake runtime: which backbone a schema
 * gets, and the calls the bucketed one makes of a program with fixed shapes —
 * its padding, lengths, choice of `step` method, and two-call polish.
 */
import { RangeDim, constraint, f16, f32, i32, i64, method } from '../../src/core/schema';
import { loadModel } from '../../src/core/model';
import {
  CODES,
  createReverbBackbone,
  type ReverbPass,
} from '../../src/extensions/speech/utils/reverbBackbone';
import { fakeJsi } from '../support/fakeJsi';
import { exported } from '../support/fixtures';
import { tracked } from '../support/lifetime';
import type { FakeTensor } from '../support/fakeTensor';

const PATH = '/models/backbone.pte';
const PREFIX = 16; // 8 text slots, then 8 reference slots
const BUCKETS: [string, number][] = [
  ['step_t4', 4],
  ['step_t8', 8],
  ['step', 16],
];
const PIECES = 48; // 24 layers' keys, then their values

const pieces = () => Array.from({ length: PIECES }, () => f16(6, PREFIX, 128));
const stepMethod = (name: string, frames: number) =>
  method(
    name,
    [i32(8, frames), ...pieces(), i32(4), f16(frames, 4, CODES)],
    [f32(2, frames), i32(2, frames), f32(2, frames), i32(6, frames), f16(frames, 4, CODES)]
  );
const bucketedSchema = (buckets: [string, number][] = BUCKETS) =>
  exported({
    ...method('prefill', [i32(PREFIX), i32(8, PREFIX), i32(2)], pieces()),
    ...buckets.reduce((all, [name, frames]) => ({ ...all, ...stepMethod(name, frames) }), {}),
  });

const dim = (paramSide: 'input' | 'output', tensorIdx: number) => ({
  paramSide,
  tensorIdx,
  dimIdx: 1,
});
const dynamicSchema = () => {
  const cache = () => f16(2, 24, 6, RangeDim(4, 1024), 128);
  const frames = () => RangeDim(4, 1024);
  return exported({
    ...method('prefill', [i64(RangeDim(2, 512)), i64(8, RangeDim(2, 512))], [cache()]),
    ...method(
      'step',
      [i64(8, frames()), cache()],
      [f32(2, frames()), i64(2, frames()), f32(2, frames())],
      [constraint.equality(dim('input', 0), dim('output', 0), dim('output', 1), dim('output', 2))]
    ),
    ...method(
      'polish',
      [i64(8, frames()), i64(1), cache()],
      [i64(6, frames())],
      [constraint.equality(dim('input', 0), dim('output', 0))]
    ),
  });
};

const values = (t: FakeTensor): number[] =>
  Array.from({ length: t.numel }, (_, i) => t.getElement(i));

type Call = {
  methodName: string;
  inputCount: number;
  outputCount: number;
  tokens: number[]; // prefill: the text
  reference: number[]; // prefill only
  lengths: number[];
  priorId: number;
  logitsId: number;
};
let calls: Call[] = [];

/**
 * Registers a bucketed program. A `step` call fills its outputs with values
 * that name the call and the slot: `1000 * call + slot` for confidence,
 * `100 * call + slot` for prediction, the negated confidence for held, and
 * `10 * call + row` for the codes of codebooks 2-7.
 * @param schema The program's schema.
 */
const registerBucketed = (schema = bucketedSchema()): void => {
  calls = [];
  fakeJsi.registerModel(PATH, {
    schema,
    execute: (methodName, inputs, outputs) => {
      const tensors = inputs as FakeTensor[];
      const call = calls.length;
      const isPrefill = methodName === 'prefill';
      calls.push({
        methodName,
        inputCount: tensors.length,
        outputCount: outputs.length,
        tokens: values(tensors[0]!),
        reference: isPrefill ? values(tensors[1]!) : [],
        lengths: values(tensors[isPrefill ? 2 : PIECES + 1]!),
        priorId: isPrefill ? -1 : tensors[PIECES + 2]!.id,
        logitsId: isPrefill ? -1 : outputs[4]!.id,
      });
      if (isPrefill) return;
      const frames = outputs[0]!.shape[1]!;
      for (let i = 0; i < 2 * frames; i++) {
        outputs[0]!.setElement(i, 1000 * call + i);
        outputs[1]!.setElement(i, 100 * call + i);
        outputs[2]!.setElement(i, -(1000 * call + i));
      }
      for (let row = 0; row < 6; row++) {
        for (let f = 0; f < frames; f++) outputs[3]!.setElement(row * frames + f, 10 * call + row);
      }
    },
  });
};

const backboneOf = () => {
  const model = tracked(loadModel(PATH));
  return tracked(createReverbBackbone(model));
};
const emptyPass = (frames: number): ReverbPass => ({
  confidence: new Float32Array(2 * frames),
  prediction: new BigInt64Array(2 * frames),
  held: new Float32Array(2 * frames),
});
const codesOf = (references: number): BigInt64Array =>
  BigInt64Array.from({ length: 8 * references }, (_, i) => BigInt(i + 1));

describe('createReverbBackbone', () => {
  it('reads the limits of a dynamic program from its ranges', () => {
    fakeJsi.registerModel(PATH, { schema: dynamicSchema() });

    expect(backboneOf().limits).toEqual({
      promptTokens: { min: 2, max: 512, step: 1 },
      referenceFrames: { min: 2, max: 512, step: 1 },
      targetFrames: { min: 4, max: 1024, step: 1 },
    });
  });

  it('gives a program with fixed shapes half the prefix each and its largest step', () => {
    registerBucketed();

    expect(backboneOf().limits).toEqual({
      promptTokens: { min: 1, max: 8, step: 1 },
      referenceFrames: { min: 1, max: 8, step: 1 },
      targetFrames: { min: 1, max: 16, step: 1 },
    });
  });

  it('needs only `step` among the step methods', () => {
    registerBucketed(bucketedSchema([['step', 16]]));
    const session = backboneOf().open(Int32Array.of(7), codesOf(2), 3);
    session.step(new BigInt64Array(8 * 3).fill(BigInt(CODES)), emptyPass(3));

    expect(calls.map(({ methodName }) => methodName)).toEqual(['prefill', 'step']);
  });

  it('rejects a program that is neither', () => {
    fakeJsi.registerModel(PATH, {
      schema: exported(method('forward', [f32(1, 4)], [f32(1, 4)])),
    });

    expect(() => createReverbBackbone(tracked(loadModel(PATH)))).toThrow(/dynamic[\s\S]*bucketed/);
  });

  it('rejects a step method that does not follow the others', () => {
    registerBucketed(
      exported({
        ...bucketedSchema(),
        ...method('step_wide', [i32(8, 32)], [f32(2, 32)]),
      })
    );

    expect(() => createReverbBackbone(tracked(loadModel(PATH)))).toThrow(/step_wide/);
  });
});

describe('the bucketed backbone', () => {
  beforeEach(() => registerBucketed());

  it('prefills the prompt and the reference into their halves of the prefix', () => {
    backboneOf().open(Int32Array.of(11, 12, 13), codesOf(2), 4);

    const [prefill] = calls;
    expect(prefill).toMatchObject({ methodName: 'prefill', inputCount: 3, outputCount: PIECES });
    expect(prefill!.lengths).toEqual([3, 2]);
    expect(prefill!.tokens).toEqual([11, 12, 13, ...new Array(PREFIX - 3).fill(0)]);
    // Codebook c holds codes 2c+1 and 2c+2, in reference slots 8 and 9.
    for (let c = 0; c < 8; c++) {
      const row = prefill!.reference.slice(c * PREFIX, (c + 1) * PREFIX);
      expect(row).toEqual([...new Array(8).fill(0), 2 * c + 1, 2 * c + 2, ...new Array(6).fill(0)]);
    }
  });

  it.each([
    [1, 'step_t4'],
    [4, 'step_t4'],
    [5, 'step_t8'],
    [8, 'step_t8'],
    [9, 'step'],
    [16, 'step'],
  ])('runs %i frames on %s', (frames, name) => {
    const session = backboneOf().open(Int32Array.of(1), codesOf(1), frames);
    session.step(new BigInt64Array(8 * frames).fill(BigInt(CODES)), emptyPass(frames));

    expect(calls[1]!.methodName).toBe(name);
  });

  it('pads the tokens with the mask code and passes the real lengths', () => {
    const frames = 3;
    const tokens = BigInt64Array.from({ length: 8 * frames }, (_, i) => BigInt(i));
    backboneOf().open(Int32Array.of(1, 2), codesOf(5), frames).step(tokens, emptyPass(frames));

    const step = calls[1]!;
    expect(step).toMatchObject({ methodName: 'step_t4', inputCount: PIECES + 3, outputCount: 5 });
    expect(step.lengths).toEqual([2, 5, frames, 0]);
    for (let c = 0; c < 8; c++) {
      expect(step.tokens.slice(4 * c, 4 * c + 4)).toEqual([3 * c, 3 * c + 1, 3 * c + 2, CODES]);
    }
  });

  it('returns the real frames of each row of a pass', () => {
    const frames = 3;
    const pass = emptyPass(frames);
    backboneOf()
      .open(Int32Array.of(1), codesOf(1), frames)
      .step(new BigInt64Array(8 * frames).fill(BigInt(CODES)), pass);

    // Call 1 on 4 padded frames: slots 0-2 of row 0, then 4-6 of row 1.
    expect(Array.from(pass.confidence)).toEqual([1000, 1001, 1002, 1004, 1005, 1006]);
    expect(Array.from(pass.prediction, Number)).toEqual([100, 101, 102, 104, 105, 106]);
    expect(Array.from(pass.held)).toEqual([-1000, -1001, -1002, -1004, -1005, -1006]);
  });

  it('polishes with two passes that lean on the whole reference', () => {
    const frames = 3;
    const tokens = new BigInt64Array(8 * frames).fill(BigInt(CODES));
    tokens.fill(7n, 0, 2 * frames); // codebooks 0-1 are complete
    backboneOf().open(Int32Array.of(1, 2), codesOf(5), frames).polish(tokens);

    const [, first, second] = calls;
    expect(calls).toHaveLength(3);
    expect(first!.lengths).toEqual([2, 5, frames, 5]);
    expect(second!.lengths).toEqual([2, 5, frames, 5]);
    // The second pass reads the first's logits and sees its codebooks 2-3.
    expect(second!.priorId).toBe(first!.logitsId);
    expect(second!.logitsId).not.toBe(first!.logitsId);
    expect(second!.tokens.slice(2 * 4, 2 * 4 + 3)).toEqual([10, 10, 10]);
    expect(second!.tokens.slice(3 * 4, 3 * 4 + 3)).toEqual([11, 11, 11]);
    // Codebooks 2-3 from the first pass (call 1), 4-7 from the second (call 2).
    const rows = Array.from({ length: 8 }, (_, c) => Number(tokens[c * frames]!));
    expect(rows).toEqual([7, 7, 10, 11, 22, 23, 24, 25]);
  });

  it('keeps its tensors between chunks, in shared memory, and releases them on dispose', () => {
    const model = loadModel(PATH);
    const backbone = createReverbBackbone(model);
    const held = fakeJsi.liveTensors();
    expect(fakeJsi.sharedTensors()).toBe(held);

    backbone.open(Int32Array.of(1), codesOf(1), 4).dispose();
    backbone.open(Int32Array.of(1), codesOf(1), 9).dispose();
    expect(fakeJsi.liveTensors()).toBe(held);

    backbone.dispose();
    model.dispose();
    expect(fakeJsi.liveTensors()).toBe(0);
  });
});
