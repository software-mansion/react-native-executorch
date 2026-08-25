/**
 * Native C++ and JavaScript tensor math and random number generation utilities.
 * @module Math
 */

import { rnexecutorchJsi } from '../native/bridge';
import type { Tensor } from '../core/tensor';
import { RnExecuTorchError } from '../core/error';

/**
 * Configuration options for normal distribution random number generation.
 * @category Math / Types
 */
export type RandomNormalOptions = {
  /** The mean of the distribution. */
  readonly mean?: number;
  /** The standard deviation of the distribution. */
  readonly std?: number;
  /**
   * The seed for the underlying generator. When omitted, a random seed is
   * generated so different values are produced each call.
   */
  readonly seed?: number;
};

/**
 * Computes the element-wise sigmoid activation on a float32 source tensor and
 * writes the result to a destination tensor.
 * @category Math / Functions
 * @param src The input source tensor. Expected shape `[d1, ..., dn]` with data
 * type `float32`.
 * @param dst The pre-allocated destination tensor to write the result to.
 * Expected shape `[d1, ..., dn]` matching `src` with data type `float32`.
 * @returns The destination tensor `dst` containing the sigmoid output of shape
 * `[d1, ..., dn]` and data type `float32`.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if tensor shapes or
 * data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
 * `RESOURCE_DISPOSED` if either tensor was disposed.
 */
export function sigmoid(src: Tensor, dst: Tensor): Tensor {
  'worklet';
  return rnexecutorchJsi.math.sigmoid(src, dst);
}

/**
 * Computes the softmax activation along a specified axis on a float32 source
 * tensor and writes the result to a destination tensor.
 * @category Math / Functions
 * @param src The input source tensor. Expected shape `[d1, ..., dn]` with data
 * type `float32`.
 * @param dst The pre-allocated destination tensor to write the result to.
 * Expected shape `[d1, ..., dn]` matching `src` with data type `float32`.
 * @param axis The dimension along which softmax is computed. Negative indexing
 * is supported (e.g. `-1` for the last dimension). Defaults to `-1`.
 * @returns The destination tensor `dst` containing the softmax output of shape
 * `[d1, ..., dn]` and data type `float32`.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if tensor shapes,
 * data types, or `axis` are invalid, `RESOURCE_BUSY` if a tensor is in use, or
 * `RESOURCE_DISPOSED` if either tensor was disposed.
 */
export function softmax(src: Tensor, dst: Tensor, axis: number = -1): Tensor {
  'worklet';
  return rnexecutorchJsi.math.softmax(src, dst, axis);
}

/**
 * Computes the indices of the maximum values along a specified axis on a
 * float32 source tensor and writes the result to an int32 destination tensor.
 * @category Math / Functions
 * @param src The input source tensor. Expected shape `[d1, ..., dk, ..., dn]`
 * with data type `float32`.
 * @param dst The pre-allocated destination tensor to write the indices to.
 * Expected shape `[d1, ..., 1, ..., dn]` (same rank as `src` with dimension 1
 * along `axis`) and data type `int32`.
 * @param axis The dimension along which argmax is computed. Negative indexing
 * is supported (e.g. `-1` for the last dimension). Defaults to `-1`.
 * @returns The destination tensor `dst` containing the argmax indices of shape
 * `[d1, ..., 1, ..., dn]` and data type `int32`.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if tensor shapes,
 * data types, or `axis` are invalid, `RESOURCE_BUSY` if a tensor is in use, or
 * `RESOURCE_DISPOSED` if either tensor was disposed.
 */
export function argmax(src: Tensor, dst: Tensor, axis: number = -1): Tensor {
  'worklet';
  return rnexecutorchJsi.math.argmax(src, dst, axis);
}

/**
 * Reads one value per lane out of a float32 source tensor, at the positions
 * given by an int32 index tensor. Pairs with {@link argmax}, whose output has
 * exactly the shape this expects, so `argmax` then `gather` yields the maximum
 * values alongside their indices.
 * @category Math / Functions
 * @param src The input float32 source tensor. Shape [d1,...,dk,...,dn].
 * @param indices The int32 index tensor, one index per lane. Shape
 * [d1,...,1,...,dn].
 * @param dst The pre-allocated float32 destination tensor. Same shape as
 * `indices`.
 * @param axis The dimension the indices point into. Defaults to -1 (last
 * dimension).
 * @returns The destination tensor containing the gathered values.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if an index falls
 * outside the gathered axis.
 */
export function gather(src: Tensor, indices: Tensor, dst: Tensor, axis: number = -1): Tensor {
  'worklet';
  return rnexecutorchJsi.math.gather(src, indices, dst, axis);
}

/**
 * Applies the element-wise threshold step function on a float32 source tensor and
 * writes the result to a destination tensor.
 * @category Math / Functions
 * @param src The input source tensor. Expected shape `[d1, ..., dn]` with data
 * type `float32`.
 * @param dst The pre-allocated destination tensor to write the result to.
 * Expected shape `[d1, ..., dn]` matching `src` with data type `float32`.
 * @param thresholdVal The threshold value above or equal to which elements are
 * mapped to 1.0.
 * @returns The destination tensor `dst` containing the threshold step output of
 * shape `[d1, ..., dn]` and data type `float32`.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if tensor shapes or
 * data types are invalid, `RESOURCE_BUSY` if a tensor is in use, or
 * `RESOURCE_DISPOSED` if either tensor was disposed.
 */
export function threshold(src: Tensor, dst: Tensor, thresholdVal: number): Tensor {
  'worklet';
  return rnexecutorchJsi.math.threshold(src, dst, thresholdVal);
}

/**
 * Creates a mulberry32 pseudo-random generator producing uniform values in
 * `[0, 1)`. Unlike `Math.random` it accepts a seed, so a fixed seed yields a
 * reproducible sequence.
 * @category Math / Functions
 * @param seed The 32-bit integer seed for the generator.
 * @returns A function returning the next uniform pseudo-random number in `[0, 1)`.
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
 * @category Math / Functions
 * @param size The number of values to draw.
 * @param options Distribution parameters. When options or any individual
 * properties are omitted, defaults to `mean: 0`, `std: 1`, and a random seed.
 * See {@link RandomNormalOptions}.
 * @returns A `Float32Array` of `size` normally distributed values.
 */
export function randomNormal(size: number, options?: RandomNormalOptions): Float32Array {
  'worklet';
  const mean = options?.mean ?? 0;
  const std = options?.std ?? 1;
  const seed = options?.seed ?? Math.floor(Math.random() * 0x100000000);
  const uniform = mulberry32(seed);
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
 * @category Math / Functions
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
