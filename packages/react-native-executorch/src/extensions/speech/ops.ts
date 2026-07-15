import { rnexecutorchJsi } from '../../native/bridge';
import { type Tensor } from '../../core/tensor';

/**
 * Options controlling how {@link extractFrames} slices and filters the waveform.
 * @category Types
 * @property {number} numFrames - Number of frames to write (must be `<= dst.shape[0]`).
 * @property {number} hopLength - Samples between consecutive frames.
 * @property {number} preemphasis - Pre-emphasis filter coefficient.
 */
export type ExtractFramesOptions = {
  readonly numFrames: number;
  readonly hopLength: number;
  readonly preemphasis: number;
};

/**
 * Slices a mono `waveform` into `numFrames` overlapping
 * frames, applying per-frame mean-removal, a pre-emphasis filter and the `hann`
 * window, and writing each frame into a zero-padded row of `dst` (shape
 * `[frames, fftLength]`). `dst` is fully zeroed first, so rows beyond
 * `numFrames` stay zero (padding). The frame length is taken from `hann`'s
 * length and the padded width from `dst`'s last dimension.
 * @category Typescript API
 * @param waveform Input audio samples, shape `[length]`. Framing starts at the
 * first sample, so pass only the slice to be framed.
 * @param hann Precomputed Hann window, shape `[frameLength]`.
 * @param dst Pre-allocated destination, shape `[frames, fftLength]`.
 * @param options Framing options.
 * @returns The `dst` tensor, for convenience.
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
