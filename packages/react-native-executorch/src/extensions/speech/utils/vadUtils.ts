/**
 * Audio framing and pre-emphasis feature extraction for Voice Activity Detection.
 * @module Speech/Utils/VAD
 */

import { rnexecutorchJsi } from '../../../native/bridge';
import { type Tensor } from '../../../core/tensor';

/**
 * Options controlling how {@link extractFrames} slices and filters the waveform.
 * @category Speech / Types
 */
export type ExtractFramesOptions = {
  /** Number of audio frames to extract and write into the destination tensor. */
  readonly numFrames: number;
  /** Number of samples between consecutive frames. */
  readonly hopLength: number;
  /** Pre-emphasis filter coefficient. */
  readonly preemphasis: number;
};

/**
 * Slices a mono audio waveform tensor into overlapping frames, applying
 * per-frame mean-removal, a pre-emphasis filter and a Hann window, and writing
 * each frame into a zero-padded row of `dst`.
 *
 * `dst` is fully zeroed first, so rows beyond `numFrames` stay zero (padding).
 * The frame length is taken from `hann`'s length and the padded width from
 * `dst`'s last dimension.
 * @category Speech / Functions
 * @param waveform Input audio samples tensor. Expected 1D shape `[length]` with
 * data type `float32`. Framing starts at the first sample.
 * @param hann Precomputed Hann window tensor. Expected 1D shape `[frameLength]`
 * with data type `float32`.
 * @param dst Pre-allocated destination tensor. Expected 2D shape `[frames,
 * fftLength]` with data type `float32`.
 * @param options Framing options controlling frame count, hop length, and
 * pre-emphasis filtering. See {@link ExtractFramesOptions}.
 * @returns The destination tensor `dst` containing extracted frames of shape
 * `[frames, fftLength]` and data type `float32`.
 * @throws {RnExecuTorchError} With code `INVALID_ARGUMENT` if tensor shapes,
 * data types, or frame windows are invalid, `RESOURCE_BUSY` if a tensor is in
 * use, or `RESOURCE_DISPOSED` if either tensor was disposed.
 */
export function extractFrames(
  waveform: Tensor,
  hann: Tensor,
  dst: Tensor,
  options: ExtractFramesOptions
): Tensor {
  'worklet';
  return rnexecutorchJsi.speech.extractFrames(waveform, hann, dst, options);
}
