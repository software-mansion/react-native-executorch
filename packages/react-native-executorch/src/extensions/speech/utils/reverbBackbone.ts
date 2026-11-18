/**
 * The Reverb backbone behind one interface.
 *
 * The pipeline works a chunk through a session: `open` prefills the prompt and
 * the voice, `step` runs one main pass over codebooks 0-1, and `polish` fills
 * codebooks 2-7. Which model calls that takes depends on how the program was
 * exported, so the program's schema picks the backbone that makes them.
 */

import type { Model } from '../../../core/model';
import { tensor, type Tensor } from '../../../core/tensor';
import {
  validateSpec,
  method,
  i32,
  i64,
  f16,
  f32,
  DynamicDim as Dyn,
  constraint,
  type DimRef,
  type Range,
  type SpecMatch,
} from '../../../core/schema';

// Shared constants
export const CODEBOOKS = 8;
export const LATE_CODEBOOKS = CODEBOOKS - 4; // codebooks 4-7, which polish guides with a prior
export const CODES = 1024; // per codebook; the next id marks a masked slot
export const MASK_CODE = BigInt(CODES);
// K/V cache: [keys and values, layers, KV heads, prefix, head dim]
const CACHE_LAYERS = 24;
const CACHE_HEADS = 6;
const CACHE_HEAD_DIM = 128;

/** What one main pass says about codebooks 0-1, `[2, frames]` row-major each. */
export type ReverbPass = {
  /** Log-probability of the best code per slot. */
  readonly confidence: Float32Array;
  /** The best code per slot. */
  readonly prediction: BigInt64Array;
  /** Log-probability of the code a slot holds; meaningless on masked slots. */
  readonly held: Float32Array;
};

/** One chunk on the backbone, after its prompt and voice were prefilled. */
export type ReverbSession = {
  /** Runs one main pass on `tokens` (`[8, frames]`) and writes it to `pass`. */
  readonly step: (tokens: BigInt64Array, pass: ReverbPass) => void;
  /** Writes codebooks 2-7 into `tokens`, whose codebooks 0-1 are complete. */
  readonly polish: (tokens: BigInt64Array) => void;
  /** Releases the chunk's tensors. */
  readonly dispose: () => void;
};

/** A loaded backbone program and the sizes it takes. */
export type ReverbBackbone = {
  readonly limits: {
    readonly promptTokens: Range;
    readonly referenceFrames: Range;
    readonly targetFrames: Range;
  };
  /**
   * Prefills one chunk. A worklet, to call on the runtime the model runs on.
   * @param ids The prompt's token ids.
   * @param codes The voice's codec codes, `[8, reference frames]` row-major.
   * @param frames The target length.
   * @returns The chunk's session; dispose it when the chunk is done.
   */
  readonly open: (ids: Int32Array, codes: BigInt64Array, frames: number) => ReverbSession;
  /** Releases the tensors the backbone keeps between chunks. Not the program. */
  readonly dispose: () => void;
};

/**
 * Names one dimension of a method's tensor, for runtime constraints.
 * @param paramSide Whether the tensor is an input or an output.
 * @param tensorIdx The tensor's index among that side's tensors.
 * @param dimIdx The dimension; the frame axis (1) by default.
 * @returns The dimension reference.
 */
export const frameDim = (paramSide: 'input' | 'output', tensorIdx: number, dimIdx = 1): DimRef => ({
  paramSide,
  tensorIdx,
  dimIdx,
});

const cache = () => f16(2, CACHE_LAYERS, CACHE_HEADS, Dyn('P'), CACHE_HEAD_DIM);

// The MLX and Vulkan programs: every length is dynamic and polish is a method.
// prettier-ignore
const DYNAMIC_SPEC = {
  ...method(
    'prefill',
    [i64(Dyn('L')), i64(CODEBOOKS, Dyn('R'))], // prompt tokens, reference codes
    [cache()]
  ),
  ...method(
    'step',
    [i64(CODEBOOKS, Dyn('T')), cache()], // tokens
    [f32(2, Dyn('T')), i64(2, Dyn('T')), f32(2, Dyn('T'))], // confidence, prediction, held
    [constraint.equality(frameDim('input', 0), frameDim('output', 0), frameDim('output', 1), frameDim('output', 2))]
  ),
  ...method(
    'polish',
    [i64(CODEBOOKS, Dyn('T')), i64(1), cache()], // tokens, reference frames
    [i64(CODEBOOKS - 2, Dyn('T'))], // codebooks 2-7
    [constraint.equality(frameDim('input', 0), frameDim('output', 0))]
  ),
};

function dynamicBackbone(model: Model, match: SpecMatch): ReverbBackbone {
  const [promptTokens, referenceFrames, targetFrames] = match.dims.range('L', 'R', 'T');

  const open = (ids: Int32Array, codes: BigInt64Array, frames: number): ReverbSession => {
    'worklet';
    const references = codes.length / CODEBOOKS;
    const slots = 2 * frames;

    const tensors: Tensor[] = [];
    const alloc = (...args: Parameters<typeof tensor>): Tensor => {
      const t = tensor(...args);
      tensors.push(t);
      return t;
    };
    const dispose = (): void => {
      tensors.splice(0).forEach((t) => t.dispose());
    };

    try {
      // The prompt and the reference go into a K/V cache every pass reads.
      const tCache = alloc('float16', [
        2,
        CACHE_LAYERS,
        CACHE_HEADS,
        ids.length + references,
        CACHE_HEAD_DIM,
      ]);
      const tIds = alloc('int64', [ids.length], BigInt64Array.from(ids, BigInt));
      const tReference = alloc('int64', [CODEBOOKS, references], codes);
      model.execute('prefill', [tIds, tReference], [tCache]);

      const tTokens = alloc('int64', [CODEBOOKS, frames]);
      const tConfidence = alloc('float32', [2, frames]);
      const tPrediction = alloc('int64', [2, frames]);
      const tHeld = alloc('float32', [2, frames]);
      const tReferenceFrames = alloc('int64', [1], BigInt64Array.of(BigInt(references)));
      const tFine = alloc('int64', [CODEBOOKS - 2, frames]);

      return {
        step: (tokens, pass) => {
          tTokens.setData(tokens);
          model.execute('step', [tTokens, tCache], [tConfidence, tPrediction, tHeld]);
          tConfidence.getData(pass.confidence);
          tPrediction.getData(pass.prediction);
          tHeld.getData(pass.held);
        },
        polish: (tokens) => {
          tTokens.setData(tokens);
          model.execute('polish', [tTokens, tReferenceFrames, tCache], [tFine]);
          tokens.set(tFine.getData(new BigInt64Array((CODEBOOKS - 2) * frames)), slots);
        },
        dispose,
      };
    } catch (error) {
      dispose();
      throw error;
    }
  };

  return { limits: { promptTokens, referenceFrames, targetFrames }, open, dispose: () => {} };
}

// The QNN programs: static shapes and int32 ids. The prompt and the reference
// are padded into one prefix (text slots first, then reference slots, half
// each) and the target to the frames of a `step` method, with the real lengths
// passed alongside.
// Polish pass has no separate method: it is two `step` calls that say how many reference frames to lean on.
const cachePieces = () =>
  Array.from({ length: 2 * CACHE_LAYERS }, () => f16(CACHE_HEADS, 'P', CACHE_HEAD_DIM));
const bucketedSpec = (step: string) => ({
  ...method(
    'prefill',
    [i32('P'), i32(CODEBOOKS, 'P'), i32(2)], // prompt tokens, reference codes, their lengths
    cachePieces()
  ),
  ...method(
    step,
    // tokens, cache, lengths (prompt, reference, target, reference frames to lean on), prior
    [i32(CODEBOOKS, 'T'), ...cachePieces(), i32(4), f16('T', LATE_CODEBOOKS, CODES)],
    // confidence, prediction, held; codebooks 2-7 and the logits of 4-7, for polish
    [
      f32(2, 'T'),
      i32(2, 'T'),
      f32(2, 'T'),
      i32(CODEBOOKS - 2, 'T'),
      f16('T', LATE_CODEBOOKS, CODES),
    ]
  ),
});

function bucketedBackbone(model: Model, match: SpecMatch): ReverbBackbone {
  const prefix = match.dim('P', 'constant');
  const half = prefix / 2; // text in slots [0, half), reference in [half, prefix)
  // Every `step*` method is the same pass at its own target length.
  const sizes = Object.keys(model.schema)
    .filter((name) => name.startsWith('step'))
    .map((name) => ({
      name,
      frames: validateSpec(model.schema, { bucket: bucketedSpec(name) }).dim('T', 'constant'),
    }))
    .sort((a, b) => a.frames - b.frames);

  // Shapes never change, so every tensor is made once and serves every chunk.
  const tText = tensor('int32', [prefix]);
  const tReference = tensor('int32', [CODEBOOKS, prefix]);
  const tPrefixLengths = tensor('int32', [2]);
  const tLengths = tensor('int32', [4]);
  const tCache = Array.from({ length: 2 * CACHE_LAYERS }, () =>
    tensor('float16', [CACHE_HEADS, prefix, CACHE_HEAD_DIM])
  );
  const buckets = sizes.map(({ name, frames }) => ({
    name,
    frames,
    tTokens: tensor('int32', [CODEBOOKS, frames]),
    tConfidence: tensor('float32', [2, frames]),
    tPrediction: tensor('int32', [2, frames]),
    tHeld: tensor('float32', [2, frames]),
    tFine: tensor('int32', [CODEBOOKS - 2, frames]),
    // Two, to hand one pass's logits to the next as its prior.
    tLogits: [
      tensor('float16', [frames, LATE_CODEBOOKS, CODES]),
      tensor('float16', [frames, LATE_CODEBOOKS, CODES]),
    ] as const,
  }));
  const dispose = (): void => {
    [tText, tReference, tPrefixLengths, tLengths, ...tCache].forEach((t) => t.dispose());
    for (const b of buckets) {
      [b.tTokens, b.tConfidence, b.tPrediction, b.tHeld, b.tFine, ...b.tLogits].forEach((t) =>
        t.dispose()
      );
    }
  };

  const open = (ids: Int32Array, codes: BigInt64Array, frames: number): ReverbSession => {
    'worklet';
    const references = codes.length / CODEBOOKS;
    const bucket = buckets.find((b) => b.frames >= frames)!;
    const padded = bucket.frames;

    const text = new Int32Array(prefix);
    text.set(ids);
    const reference = new Int32Array(CODEBOOKS * prefix);
    for (let c = 0; c < CODEBOOKS; c++) {
      for (let r = 0; r < references; r++) {
        reference[c * prefix + half + r] = Number(codes[c * references + r]);
      }
    }
    tText.setData(text);
    tReference.setData(reference);
    tPrefixLengths.setData(Int32Array.of(ids.length, references));
    model.execute('prefill', [tText, tReference, tPrefixLengths], tCache);

    const padTokens = new Int32Array(CODEBOOKS * padded).fill(CODES);
    const confidence = new Float32Array(2 * padded);
    const prediction = new Int32Array(2 * padded);
    const held = new Float32Array(2 * padded);
    const fine = new Int32Array((CODEBOOKS - 2) * padded);

    // One pass on `tokens`, with `prior` read and `logits` written.
    const run = (tokens: BigInt64Array, lean: number, prior: Tensor, logits: Tensor): void => {
      for (let c = 0; c < CODEBOOKS; c++) {
        for (let f = 0; f < frames; f++) padTokens[c * padded + f] = Number(tokens[c * frames + f]);
      }
      bucket.tTokens.setData(padTokens);
      tLengths.setData(Int32Array.of(ids.length, references, frames, lean));
      model.execute(
        bucket.name,
        [bucket.tTokens, ...tCache, tLengths, prior],
        [bucket.tConfidence, bucket.tPrediction, bucket.tHeld, bucket.tFine, logits]
      );
    };
    // Rows `from` to `to` of the last pass's codebooks 2-7 into `tokens`.
    const takeFine = (tokens: BigInt64Array, from: number, to: number): void => {
      bucket.tFine.getData(fine);
      for (let c = from; c < to; c++) {
        for (let f = 0; f < frames; f++)
          tokens[(c + 2) * frames + f] = BigInt(fine[c * padded + f]!);
      }
    };

    return {
      step: (tokens, pass) => {
        run(tokens, 0, bucket.tLogits[0], bucket.tLogits[1]);
        bucket.tConfidence.getData(confidence);
        bucket.tPrediction.getData(prediction);
        bucket.tHeld.getData(held);
        for (let c = 0; c < 2; c++) {
          for (let f = 0; f < frames; f++) {
            pass.confidence[c * frames + f] = confidence[c * padded + f]!;
            pass.prediction[c * frames + f] = BigInt(prediction[c * padded + f]!);
            pass.held[c * frames + f] = held[c * padded + f]!;
          }
        }
      },
      polish: (tokens) => {
        // Codebooks 2-3 come from the first pass, whose logits guide the second's 4-7.
        run(tokens, references, bucket.tLogits[1], bucket.tLogits[0]);
        takeFine(tokens, 0, 2);
        run(tokens, references, bucket.tLogits[0], bucket.tLogits[1]);
        takeFine(tokens, 2, CODEBOOKS - 2);
      },
      dispose: () => {},
    };
  };

  const size = (max: number): Range => ({ min: 1, max, step: 1 });
  return {
    limits: {
      promptTokens: size(half),
      referenceFrames: size(half),
      targetFrames: size(buckets[buckets.length - 1]!.frames),
    },
    open,
    dispose,
  };
}

/**
 * Wraps a loaded backbone program in the backbone its schema calls for.
 * @param model The backbone program.
 * @returns The backbone.
 * @throws {RnExecuTorchError} With code `SCHEMA_MISMATCH` if the program is
 * not a Reverb backbone.
 */
export function createReverbBackbone(model: Model): ReverbBackbone {
  const match = validateSpec(model.schema, {
    dynamic: DYNAMIC_SPEC,
    bucketed: bucketedSpec('step'),
  });
  return { dynamic: dynamicBackbone, bucketed: bucketedBackbone }[match.variant](model, match);
}
