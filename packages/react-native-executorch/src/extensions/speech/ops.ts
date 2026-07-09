import { rnexecutorchJsi } from '../../native/bridge';
import { type Tensor } from '../../core/tensor';

/**
 * Native framing op: slices a mono `waveform` into `numFrames` overlapping
 * frames starting at sample `startSample`, applying per-frame mean-removal, a
 * pre-emphasis filter and the `hann` window, and writing each frame into a
 * zero-padded row of `dst` (shape `[frames, fftLength]`). `dst` is fully zeroed
 * first, so rows beyond `numFrames` stay zero (padding). The frame length is
 * taken from `hann`'s length and the padded width from `dst`'s last dimension.
 * @category Typescript API
 * @param waveform Input audio samples, shape `[length]`.
 * @param hann Precomputed Hann window, shape `[frameLength]`.
 * @param dst Pre-allocated destination, shape `[frames, fftLength]`.
 * @param startSample Index of the first sample of the first frame.
 * @param numFrames Number of frames to write (must be `<= dst.shape[0]`).
 * @param hopLength Samples between consecutive frames.
 * @param preemphasis Pre-emphasis filter coefficient.
 * @returns The `dst` tensor, for convenience.
 */
export function frameWaveform(
  waveform: Tensor,
  hann: Tensor,
  dst: Tensor,
  startSample: number,
  numFrames: number,
  hopLength: number,
  preemphasis: number
): Tensor {
  'worklet';
  return rnexecutorchJsi.speech.frameWaveform(
    waveform,
    hann,
    dst,
    startSample,
    numFrames,
    hopLength,
    preemphasis
  );
}
