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

/**
 * Crops an audio tensor to the predicted end timestamp of its last meaningful
 * token, removing the trailing synthesis artifacts that occur after speech has
 * ended.
 *
 * Per-token end timestamps are accumulated from {@link durationsTensor} (each
 * duration frame spans a fixed number of audio samples). The trailing PAD token
 * is always dropped; when the segment does not end with a letter, the
 * EOS/punctuation token before it is dropped as well.
 * @param audioTensor - A float32 audio tensor produced by the synthesizer.
 * @param durationsTensor - The int64 per-token durations used for synthesis.
 * @param endsWithAlpha - `true` if the segment ends with an alphabetic
 *   character. Crops at the second-to-last token when `true`, third-to-last
 *   otherwise.
 * @returns A non-owning view tensor over the kept portion of the audio.
 */
export function cropToTimestamp(
  audioTensor: Tensor,
  durationsTensor: Tensor,
  endsWithAlpha: boolean
): Tensor {
  'worklet';
  return rnexecutorchJsi.speech.kokoro.cropToTimestamp(
    audioTensor,
    durationsTensor,
    endsWithAlpha
  ) as Tensor;
}
