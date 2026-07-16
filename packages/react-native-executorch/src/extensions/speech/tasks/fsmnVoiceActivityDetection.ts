import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';
import { extractFrames } from '../ops';

/**
 * Sample rate (Hz) the FSMN-VAD model expects its input waveform to be at.
 * @category Constants
 */
export const FSMN_VAD_SAMPLE_RATE_HZ = 16000;

// Model + pipeline constants. The feature-extraction geometry (frame/hop/etc.)
// is baked into the exported FSMN-VAD `.pte` — properties of the model, not
// user-tunable knobs — so it lives here rather than in the `models` registry;
// `fftLength` is read from the model metadata.
const FRAME_LENGTH = 400; // 25 ms analysis window
const HOP_LENGTH = 160; // 10 ms between windows
const PREEMPHASIS = 0.97;
const MIN_FRAMES = 100; // fewest frames the model accepts per forward pass
const SAMPLES_PER_MS = FSMN_VAD_SAMPLE_RATE_HZ / 1000;
const HOP_LENGTH_MS = HOP_LENGTH / SAMPLES_PER_MS;
// `push` detects over a bounded 2.5s window of the most recent audio: model cost
// scales with window length, and 2.5s already exceeds FSMN's receptive field
// (~200ms) and the min-speech duration (250ms).
const DETECTION_WINDOW_SECONDS = 2.5;
const WINDOW_SAMPLES = DETECTION_WINDOW_SECONDS * FSMN_VAD_SAMPLE_RATE_HZ;
const DEFAULT_DETECTION_MARGIN_MS = 100;

/**
 * Tunable thresholds controlling how per-frame speech probabilities are turned
 * into speech {@link Segment}s.
 * @category Types
 * @property {number} [speechThreshold] - Minimum speech probability (0-1) for a
 * frame to count as speech. Defaults to `0.6`.
 * @property {number} [minSpeechDurationMs] - Minimum duration a region must stay
 * above the threshold to open a segment. Defaults to `250`.
 * @property {number} [minSilenceDurationMs] - Minimum duration below the
 * threshold required to close a segment. Defaults to `100`.
 * @property {number} [speechPadMs] - Padding added to both ends of every
 * detected segment. Defaults to `30`.
 * @property {number} [mergeGapMs] - Segments closer than this gap are merged
 * into one. Defaults to `0`.
 */
export type VadOptions = {
  readonly speechThreshold?: number;
  readonly minSpeechDurationMs?: number;
  readonly minSilenceDurationMs?: number;
  readonly speechPadMs?: number;
  readonly mergeGapMs?: number;
};

// Library fallback thresholds. A model may override any of these via
// `FsmnVadModel.defaultOptions`, and callers via the `detectVoice` options argument.
const DEFAULT_VAD_OPTIONS: Required<VadOptions> = {
  speechThreshold: 0.6,
  minSpeechDurationMs: 250,
  minSilenceDurationMs: 100,
  speechPadMs: 30,
  mergeGapMs: 0,
};

/**
 * Model configuration required to instantiate an FSMN-VAD task runner.
 * @category Types
 * @property {string} modelPath - Local path or remote URL of the `.pte` model.
 * @property {VadOptions} [defaultOptions] - Detection thresholds tuned for this
 * model; overridable per `detectVoice` call. Falls back to the library defaults.
 */
export type FsmnVadModel = {
  readonly modelPath: string;
  readonly defaultOptions?: VadOptions;
};

/**
 * A detected speech region, with start and end expressed in seconds.
 * @category Types
 */
export type Segment = {
  readonly start: number;
  readonly end: number;
};

/**
 * Options controlling live detection via `push`. Extends the per-call detection
 * thresholds ({@link VadOptions}).
 * @category Types
 * @property {number} [detectionMargin] - How recent (in milliseconds) the last
 * detected speech segment must reach toward the end of the window for speech to
 * still be considered ongoing. Defaults to `100`.
 */
export type VadStreamOptions = VadOptions & {
  readonly detectionMargin?: number;
};

/**
 * A speech-activity transition reported by `push`.
 * @category Types
 */
export type VadEvent = 'speechStart' | 'speechEnd';

// Periodic Hann window applied to each frame to reduce spectral leakage before
// the model consumes it. See https://en.wikipedia.org/wiki/Hann_function.
function hannWindow(size: number): Float32Array {
  'worklet';
  const window = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / size));
  }
  return window;
}

// Turns per-frame non-speech probabilities into speech segments in seconds:
// threshold with hysteresis, pad both ends, then merge near-adjacent regions.
// Mirrors `VoiceActivityDetection::postprocess` + `utils::mergeSegments`.
// `scores[i]` holds the non-speech probability of frame `i`, so the speech
// probability is `1 - scores[i]`.
function postprocess(scores: Float32Array, opts: Required<VadOptions>): Segment[] {
  'worklet';
  const threshold = opts.speechThreshold;
  const minSpeechHops = Math.floor(opts.minSpeechDurationMs / HOP_LENGTH_MS);
  const minSilenceHops = Math.floor(opts.minSilenceDurationMs / HOP_LENGTH_MS);
  const speechPadHops = Math.floor(opts.speechPadMs / HOP_LENGTH_MS);
  const maxMergeGapHops = opts.mergeGapMs / HOP_LENGTH_MS;

  // Threshold with hysteresis: a region must stay above the threshold for
  // `minSpeechHops` to open a segment, and below it for `minSilenceHops` to
  // close one. Bounds are in hop (frame) units.
  const hops: Segment[] = [];
  let triggered = false;
  let startHop = -1;
  let potentialStart = -1;
  let potentialEnd = -1;

  for (let i = 0; i < scores.length; i++) {
    const isSpeech = 1 - scores[i]! >= threshold;
    if (!triggered) {
      if (!isSpeech) {
        potentialStart = -1;
      } else if (potentialStart === -1) {
        potentialStart = i;
      } else if (i - potentialStart >= minSpeechHops) {
        triggered = true;
        startHop = potentialStart;
        potentialStart = -1;
      }
    } else if (isSpeech) {
      potentialEnd = -1;
    } else if (potentialEnd === -1) {
      potentialEnd = i;
    } else if (i - potentialEnd >= minSilenceHops) {
      triggered = false;
      hops.push({ start: startHop, end: potentialEnd });
      potentialEnd = -1;
    }
  }
  if (triggered) hops.push({ start: startHop, end: scores.length });

  // Pad both ends, then merge regions separated by at most `mergeGapMs`.
  const merged: Segment[] = [];
  for (const hop of hops) {
    const start = hop.start > speechPadHops ? hop.start - speechPadHops : 0;
    const end = Math.min(hop.end + speechPadHops, scores.length);
    const last = merged[merged.length - 1];
    if (last && (start < last.end || start - last.end <= maxMergeGapHops)) {
      merged[merged.length - 1] = { start: last.start, end: Math.max(last.end, end) };
    } else {
      merged.push({ start, end });
    }
  }

  const hopSeconds = HOP_LENGTH / FSMN_VAD_SAMPLE_RATE_HZ;
  return merged.map((s) => ({ start: s.start * hopSeconds, end: s.end * hopSeconds }));
}

/**
 * Creates a Voice Activity Detection runner for the FSMN-VAD model.
 *
 * It loads the model, validates its input/output signature and registers a
 * disposal hook. The whole pipeline — feature extraction, chunked inference and
 * segment postprocessing — runs in TypeScript on top of the core `model.execute`
 * primitive.
 * @category Typescript API
 * @param config VAD task configuration containing the model path.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to an object containing detection and disposal
 * controls.
 */
export async function createFsmnVoiceActivityDetector(
  config: FsmnVadModel,
  runtime?: WorkletRuntime
): Promise<{
  /**
   * Releases all allocated native resources.
   */
  dispose: () => void;
  /**
   * Asynchronously detects speech segments within a mono waveform sampled at
   * {@link FSMN_VAD_SAMPLE_RATE_HZ}.
   * @param waveform The input audio samples.
   * @param options Optional per-call overrides of the detection thresholds.
   * @returns A promise resolving to the detected speech segments, in seconds.
   */
  detectVoice: (waveform: Float32Array, options?: VadOptions) => Promise<Segment[]>;
  /**
   * Synchronous version of {@link detectVoice} to be executed directly on the caller
   * or worklet thread.
   */
  detectVoiceWorklet: (waveform: Float32Array, options?: VadOptions) => Segment[];
  /**
   * Appends a live audio chunk to a bounded rolling window, runs detection over
   * that window and reports a {@link VadEvent} when speech starts or stops,
   * otherwise `null`. Designed to be driven straight from a recorder callback.
   * Detection runs synchronously on the calling thread (a few ms).
   * @param chunk The newly captured audio samples.
   * @param options Optional overrides of the detection thresholds and margin.
   */
  push: (chunk: Float32Array, options?: VadStreamOptions) => VadEvent | null;
  /**
   * Clears the rolling window and speaking state used by {@link push}.
   */
  resetStream: () => void;
}> {
  const { modelPath } = config;
  const modelDefaults: Required<VadOptions> = { ...DEFAULT_VAD_OPTIONS, ...config.defaultOptions };

  const model = await wrapAsync(loadModel, runtime)(modelPath);

  // Input is [frames, fftLength] with a dynamic frame count; the output is
  // [1, frames, classes] where class 0 is the non-speech class. The output frame
  // count matches the input at runtime, but ExecuTorch metadata only reports the
  // static upper bound, so the per-call output tensor is sized explicitly below.
  const meta = validateModelSchema(
    model,
    'forward',
    [SymbolicTensor('float32', ['frames', 'fftLength'])],
    [SymbolicTensor('float32', [1, 'frames', 'classes'])]
  );
  const maxFrames = meta.inputTensorMeta[0]!.shape[0]!;
  const fftLength = meta.inputTensorMeta[0]!.shape[1]!;
  const numClass = meta.outputTensorMeta[0]!.shape[2]!;

  // The Hann window is uploaded once and reused by the native framing op across
  // every call.
  const tensors = [tensor('float32', [FRAME_LENGTH], hannWindow(FRAME_LENGTH))] as const;
  const [tHann] = tensors;

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    model.dispose();
  };

  const detectVoiceWorklet = (waveform: Float32Array, options?: VadOptions): Segment[] => {
    'worklet';
    const opts: Required<VadOptions> = { ...modelDefaults, ...options };
    const numFrames = Math.floor((waveform.length - FRAME_LENGTH) / HOP_LENGTH);
    if (numFrames <= 0) return [];

    const scores = new Float32Array(numFrames);
    let offset = 0;
    while (offset < numFrames) {
      const realFrames = Math.min(numFrames - offset, maxFrames);
      // The model needs at least MIN_FRAMES rows, so a short final chunk is
      // zero-padded up to it and its padding scores are discarded below.
      const chunkFrames = Math.max(realFrames, MIN_FRAMES);
      const startSample = offset * HOP_LENGTH;
      const sampleCount = (realFrames - 1) * HOP_LENGTH + FRAME_LENGTH;

      const tWaveform = tensor(
        'float32',
        [sampleCount],
        waveform.subarray(startSample, startSample + sampleCount)
      );
      const tInput = tensor('float32', [chunkFrames, fftLength]);
      const tOutput = tensor('float32', [1, chunkFrames, numClass]);
      const outBuffer = new Float32Array(tOutput.numel);
      try {
        extractFrames(tWaveform, tHann, tInput, {
          numFrames: realFrames,
          hopLength: HOP_LENGTH,
          preemphasis: PREEMPHASIS,
        });
        model.execute('forward', [tInput], [tOutput]);
        tOutput.getData(outBuffer);
      } finally {
        tOutput.dispose();
        tInput.dispose();
        tWaveform.dispose();
      }

      for (let i = 0; i < realFrames; i++) {
        scores[offset + i] = outBuffer[i * numClass]!;
      }
      offset += realFrames;
    }

    return postprocess(scores, opts);
  };

  const detectVoice = wrapAsync(detectVoiceWorklet, runtime);

  let window = new Float32Array(0);
  let wasSpeaking = false;

  const push = (chunk: Float32Array, options?: VadStreamOptions): VadEvent | null => {
    const next = new Float32Array(window.length + chunk.length);
    next.set(window);
    next.set(chunk, window.length);
    window = next.length > WINDOW_SAMPLES ? next.slice(next.length - WINDOW_SAMPLES) : next;

    // Speech is ongoing if the last detected segment reaches close enough to the
    // end of the window (within detectionMargin).
    const segments = detectVoiceWorklet(window, options);
    let isSpeaking = false;
    if (segments.length > 0) {
      const windowEndSec = window.length / FSMN_VAD_SAMPLE_RATE_HZ;
      const diffMs = (windowEndSec - segments[segments.length - 1]!.end) * 1000;
      isSpeaking = diffMs <= (options?.detectionMargin ?? DEFAULT_DETECTION_MARGIN_MS);
    }

    if (isSpeaking === wasSpeaking) return null;
    wasSpeaking = isSpeaking;
    return isSpeaking ? 'speechStart' : 'speechEnd';
  };

  const resetStream = () => {
    window = new Float32Array(0);
    wasSpeaking = false;
  };

  return { dispose, detectVoice, detectVoiceWorklet, push, resetStream };
}
