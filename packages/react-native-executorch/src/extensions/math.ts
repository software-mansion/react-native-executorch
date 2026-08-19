import { rnexecutorchJsi } from '../native/bridge';
import type { Tensor } from '../core/tensor';
import { RnExecuTorchError } from '../core/error';

/**
 * Computes the element-wise sigmoid activation on a float32 source tensor and
 * writes the result to a destination tensor.
 * @category Typescript API
 * @param src The input float32 source tensor. Shape [d1,...,dn].
 * @param dst The pre-allocated float32 destination tensor to write the result
 * to. `dst` tensor must have the same shape as `src`. Shape [d1,...,dn].
 * @returns The destination tensor containing the sigmoid output.
 */
export function sigmoid(src: Tensor, dst: Tensor): Tensor {
  'worklet';
  return rnexecutorchJsi.math.sigmoid(src, dst);
}

/**
 * Computes the softmax activation along a specified axis on a float32 source
 * tensor and writes the result to a destination tensor.
 * @category Typescript API
 * @param src The input float32 source tensor. Shape [d1,...,dn].
 * @param dst The pre-allocated float32 destination tensor to write the result
 * to. `dst` tensor must have the same shape as `src`. Shape [d1,...,dn].
 * @param axis The dimension along which softmax is computed. Defaults to -1
 * (last dimension).
 * @returns The destination tensor containing the softmax output.
 */
export function softmax(src: Tensor, dst: Tensor, axis: number = -1): Tensor {
  'worklet';
  return rnexecutorchJsi.math.softmax(src, dst, axis);
}

/**
 * Computes the indices of the maximum values along a specified axis on a
 * float32 source tensor and writes the result to an int32 destination tensor.
 * @category Typescript API
 * @param src The input float32 source tensor. Shape [d1,...,dk,...,dn].
 * @param dst The pre-allocated int32 destination tensor to write the indices
 * to. Shape [d1,...,1,...,dn].
 * @param axis The dimension along which argmax is computed. Defaults to -1
 * (last dimension).
 * @returns The destination tensor containing the argmax output.
 */
export function argmax(src: Tensor, dst: Tensor, axis: number = -1): Tensor {
  'worklet';
  return rnexecutorchJsi.math.argmax(src, dst, axis);
}

/**
 * Applies the element-wise threshold step function on a float32 source tensor and
 * writes the result to a destination tensor.
 * @category Typescript API
 * @param src The input float32 source tensor. Shape [d1,...,dn].
 * @param dst The pre-allocated destination tensor to write the result to.
 * `dst` tensor must have the same shape as `src` and have dtype float32.
 * @param thresholdVal The threshold value above or equal to which elements are mapped to 1.0.
 * @returns The destination tensor containing the threshold step output.
 */
export function threshold(src: Tensor, dst: Tensor, thresholdVal: number): Tensor {
  'worklet';
  return rnexecutorchJsi.math.threshold(src, dst, thresholdVal);
}

/**
 * Creates a mulberry32 pseudo-random generator producing uniform values in
 * `[0, 1)`. Unlike `Math.random` it accepts a seed, so a fixed seed yields a
 * reproducible sequence.
 * @category Typescript API
 * @param seed The 32-bit seed for the generator.
 * @returns A function returning the next uniform value in `[0, 1)`.
 */
export function mulberry32(seed: number): () => number {
  'worklet';
  // eslint-disable-next-line no-bitwise
  let state = seed >>> 0;
  return () => {
    'worklet';
    /* eslint-disable no-bitwise */
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    /* eslint-enable no-bitwise */
  };
}

/**
 * Draws normally distributed values using the Box–Muller transform, seeded via
 * {@link mulberry32} so a fixed `seed` reproduces the same sequence.
 * @category Typescript API
 * @param size The number of values to draw.
 * @param options Distribution parameters.
 * @param options.mean The mean of the distribution. Defaults to 0.
 * @param options.std The standard deviation of the distribution. Defaults to 1.
 * @param options.seed The seed for the underlying generator. Defaults to a
 * time-based value, so omitting it produces different values each call.
 * @returns A `Float32Array` of `size` normally distributed values.
 */
export function randomNormal(
  size: number,
  options?: { mean?: number; std?: number; seed?: number }
): Float32Array {
  'worklet';
  const mean = options?.mean ?? 0;
  const std = options?.std ?? 1;
  const uniform = mulberry32(options?.seed ?? Date.now());
  const out = new Float32Array(size);
  for (let i = 0; i < size; i += 2) {
    // Guard against log(0) when the generator returns exactly 0.
    const u1 = Math.max(uniform(), 1e-7);
    const u2 = uniform();
    const mag = std * Math.sqrt(-2.0 * Math.log(u1));
    out[i] = mean + mag * Math.cos(2.0 * Math.PI * u2);
    if (i + 1 < size) out[i + 1] = mean + mag * Math.sin(2.0 * Math.PI * u2);
  }
  return out;
}

/**
 * Repeats each element of `values` as many times as the matching entry of
 * `repeats`, concatenating the runs into a newly allocated array of the same
 * kind — the equivalent of PyTorch's `repeat_interleave` over a 1-D input.
 *
 * Non-positive repeat counts drop their element.
 * @category Typescript API
 * @typeParam T The array kind of `values` (any typed array or a plain array),
 * preserved in the result.
 * @param values The values to repeat.
 * @param repeats The repeat count for each value. Must be the same length as
 * `values`.
 * @returns A new array of the same kind holding the repeated runs.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if `repeats` and
 * `values` have different lengths.
 */
export function repeatInterleave<T extends ArrayLike<number> | ArrayLike<bigint>>(
  values: T,
  repeats: ArrayLike<number>
): T {
  'worklet';
  if (repeats.length !== values.length) {
    throw RnExecuTorchError(
      'INVALID_ARGUMENT',
      `repeatInterleave: repeats length (${repeats.length}) must match values length (${values.length}).`
    );
  }

  let total = 0;
  for (let i = 0; i < repeats.length; i++) total += Math.max(0, repeats[i]!);

  const Ctor = values.constructor as new (length: number) => T;
  const out = new Ctor(total);
  const target = out as Record<number, number | bigint>;

  let next = 0;
  for (let i = 0; i < values.length; i++) {
    const value = values[i]!;
    const count = Math.max(0, repeats[i]!);

    for (let j = 0; j < count; j++) target[next++] = value;
  }

  return out;
}
