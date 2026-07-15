import { rnexecutorchJsi } from '../native/bridge';
import type { Tensor } from '../core/tensor';

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
 * Draws normally distributed values using the Box–Muller transform over a
 * caller-supplied uniform generator.
 * @category Typescript API
 * @param size The number of values to draw.
 * @param uniform A generator of uniform values in `[0, 1)`, e.g. {@link mulberry32}.
 * @param mean The mean of the distribution. Defaults to 0.
 * @param std The standard deviation of the distribution. Defaults to 1.
 * @returns A `Float32Array` of `size` normally distributed values.
 */
export function randomNormal(
  size: number,
  uniform: () => number,
  mean: number = 0,
  std: number = 1
): Float32Array {
  'worklet';
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
