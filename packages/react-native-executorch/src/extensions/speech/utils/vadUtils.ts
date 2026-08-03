import { rnexecutorchJsi } from '../../../native/bridge';
import { type Tensor } from '../../../core/tensor';

/**
 * Options controlling how {@link extractFrames} slices and filters the waveform.
 * @category Types
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
 * @param options.numFrames Number of frames to write (must not exceed `dst`
 * tensor's first dimension `dst.shape[0]`).
 * @param options.hopLength Number of audio samples between consecutive frames.
 * @param options.preemphasis Pre-emphasis filter coefficient.
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
