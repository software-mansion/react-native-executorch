import { rnexecutorchJsi } from '../../../../native/bridge';
import type { Tensor } from '../../../../core/tensor';

/**
 * Sums all elements of a duration tensor to get a total duration.
 * @param durationsTensor - A duration tensor.
 * @returns The total accumulated duration.
 */
export function sumDurations(durationsTensor: Tensor): number {
  'worklet';
  return rnexecutorchJsi.speech.kokoro.sumDurations(durationsTensor) as number;
}

/**
 * Scales the first {@link nTokens} durations in-place so they sum to
 * {@link targetDuration}, preserving relative proportions via remainder-based
 * rounding distribution.
 * @param durationsTensor - An int64 tensor of durations.
 * @param nTokens - Number of leading elements to scale.
 * @param targetDuration - Desired total sum after scaling.
 */
export function scaleDurations(
  durationsTensor: Tensor,
  nTokens: number,
  targetDuration: number
): void {
  'worklet';
  rnexecutorchJsi.speech.kokoro.scaleDurations(durationsTensor, nTokens, targetDuration);
}

/**
 * Expands a compact durations tensor into a repeated-indices array, building
 * an alignment.
 * For input [5, 3, 2] produces [0,0,0,0,0, 1,1,1, 2,2] in the output tensor.
 * @param durationsTensor - An int64 tensor of per-token durations.
 * @param outputTensor - An int64 tensor with enough capacity for the expanded
 *   result (sum of durations elements).
 */
export function expandDurations(durationsTensor: Tensor, outputTensor: Tensor): void {
  'worklet';
  rnexecutorchJsi.speech.kokoro.expandDurations(durationsTensor, outputTensor);
}
