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
