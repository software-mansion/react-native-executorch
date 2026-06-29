import { rnexecutorchJsi } from '../../../native/bridge';
import type { Tensor } from '../../../core/tensor';

/**
 * Strips leading and trailing silence from an audio tensor using a
 * sliding-window moving average. (TODO: change to energy-based)
 * @param audioTensor - A float32 1-D tensor of audio samples.
 * @param steps - Number of samples in the moving average window.
 * @param threshold - Amplitude floor; windows whose average exceeds this
 *   value are considered non-silent.
 * @returns A non-owning tensor view over the live audio region.
 */
export function crop(audioTensor: Tensor, steps: number, threshold: number): Tensor {
  'worklet';
  return rnexecutorchJsi.speech.audio.crop(audioTensor, steps, threshold) as Tensor;
}
