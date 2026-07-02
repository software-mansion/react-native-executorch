import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';

// Frame geometry fixed by the FSMN-VAD feature-extraction contract (ported from
// the native `voice_activity_detection/Constants.h`). Audio is expected to be a
// mono waveform sampled at 16 kHz.
const SAMPLE_RATE = 16000;
const SAMPLES_PER_MS = SAMPLE_RATE / 1000; // 16
const WINDOW_SIZE = 400; // 25 ms window
const HOP_LENGTH = 160; // 10 ms hop
const HOP_LENGTH_MS = HOP_LENGTH / SAMPLES_PER_MS; // 10
const PADDED_WINDOW_SIZE = 512; // bit_ceil(WINDOW_SIZE)
const PREEMPHASIS_COEFF = 0.97;
// Zero-padding that centers the WINDOW_SIZE window inside the padded frame.
const LEFT_PAD = Math.floor((PADDED_WINDOW_SIZE - WINDOW_SIZE) / 2); // 56
// The model requires at least this many frames per forward pass; a short final
// chunk is zero-padded up to it (matches native `kModelInputMin`).
const MIN_MODEL_FRAMES = 100;

/**
 * Tunable thresholds controlling how per-frame speech probabilities are turned
 * into speech {@link Segment}s. Defaults mirror the reference FSMN-VAD
 * configuration.
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
export type VADOptions = {
  readonly speechThreshold?: number;
  readonly minSpeechDurationMs?: number;
  readonly minSilenceDurationMs?: number;
  readonly speechPadMs?: number;
  readonly mergeGapMs?: number;
};

/**
 * Model configuration required to instantiate a VAD task runner.
 * @category Types
 */
export type VADModel = {
  readonly modelPath: string;
};

/**
 * A detected speech region, with start and end expressed in seconds.
 * @category Types
 */
export type Segment = {
  readonly start: number;
  readonly end: number;
};

// Resolved options with defaults applied. Kept separate so `detectWorklet` can
// read every field unconditionally.
type ResolvedOptions = Required<VADOptions>;

const DEFAULT_OPTIONS: ResolvedOptions = {
  speechThreshold: 0.6,
  minSpeechDurationMs: 250,
  minSilenceDurationMs: 100,
  speechPadMs: 30,
  mergeGapMs: 0,
};

// A speech region measured in raw sample indices (internal to postprocessing).
type SampleSegment = { start: number; end: number };

// Periodic Hann window used to reduce spectral leakage on each frame. Ported
// from `dsp::hannWindow` (periodic definition, divides by `size`).
function hannWindow(size: number): Float32Array {
  'worklet';
  const window = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / size));
  }
  return window;
}

// Slices the waveform into overlapping frames and applies mean-removal, a
// pre-emphasis filter and a Hann window to each, writing the result into a
// zero-padded `PADDED_WINDOW_SIZE` buffer. Returns a flat `[numFrames * 512]`
// array. Mirrors `VoiceActivityDetection::preprocess`.
function frameWaveform(waveform: Float32Array, hann: Float32Array): Float32Array {
  'worklet';
  const numFrames = Math.floor((waveform.length - WINDOW_SIZE) / HOP_LENGTH);
  if (numFrames <= 0) return new Float32Array(0);

  const frames = new Float32Array(numFrames * PADDED_WINDOW_SIZE);
  for (let f = 0; f < numFrames; f++) {
    const base = f * PADDED_WINDOW_SIZE + LEFT_PAD;
    const start = f * HOP_LENGTH;

    let sum = 0;
    for (let j = 0; j < WINDOW_SIZE; j++) {
      const v = waveform[start + j]!;
      frames[base + j] = v;
      sum += v;
    }
    const mean = sum / WINDOW_SIZE;
    for (let j = 0; j < WINDOW_SIZE; j++) frames[base + j]! -= mean;

    // Pre-emphasis applied in reverse so each tap reads the raw previous sample.
    for (let j = WINDOW_SIZE - 1; j > 0; j--) {
      frames[base + j]! -= PREEMPHASIS_COEFF * frames[base + j - 1]!;
    }
    for (let j = 0; j < WINDOW_SIZE; j++) frames[base + j]! *= hann[j]!;
  }
  return frames;
}

// Converts per-frame non-speech probabilities into padded speech segments in
// sample units. Mirrors `VoiceActivityDetection::postprocess` (excluding the
// final merge step). `scores[i]` holds the non-speech probability of frame `i`,
// so the speech probability is `1 - scores[i]`.
function scoresToSegments(scores: Float32Array, opts: ResolvedOptions): SampleSegment[] {
  'worklet';
  const threshold = opts.speechThreshold;
  const minSpeechHops = Math.floor(opts.minSpeechDurationMs / HOP_LENGTH_MS);
  const minSilenceHops = Math.floor(opts.minSilenceDurationMs / HOP_LENGTH_MS);
  const speechPadHops = Math.floor(opts.speechPadMs / HOP_LENGTH_MS);

  const segments: SampleSegment[] = [];
  let triggered = false;
  let startSegment = -1;
  let potentialStart = -1;
  let potentialEnd = -1;

  for (let i = 0; i < scores.length; i++) {
    const score = 1 - scores[i]!;
    if (!triggered) {
      if (score >= threshold) {
        if (potentialStart === -1) potentialStart = i;
        else if (i - potentialStart >= minSpeechHops) {
          triggered = true;
          startSegment = potentialStart;
          potentialStart = -1;
        }
      } else {
        potentialStart = -1;
      }
    } else if (score < threshold) {
      if (potentialEnd === -1) potentialEnd = i;
      else if (i - potentialEnd >= minSilenceHops) {
        triggered = false;
        segments.push({ start: startSegment, end: potentialEnd });
        potentialEnd = -1;
      }
    } else {
      potentialEnd = -1;
    }
  }
  if (triggered) segments.push({ start: startSegment, end: scores.length });

  for (const segment of segments) {
    segment.start =
      (segment.start > speechPadHops ? segment.start - speechPadHops : 0) * HOP_LENGTH;
    segment.end = Math.min(segment.end + speechPadHops, scores.length) * HOP_LENGTH;
  }
  return segments;
}

// Merges adjacent segments separated by a gap of at most `maxMergeGap` samples.
// Mirrors `utils::mergeSegments`.
function mergeSegments(segments: SampleSegment[], maxMergeGap: number): SampleSegment[] {
  'worklet';
  if (segments.length === 0) return segments;

  const merged: SampleSegment[] = [{ start: segments[0]!.start, end: segments[0]!.end }];
  for (let i = 1; i < segments.length; i++) {
    const last = merged[merged.length - 1]!;
    const current = segments[i]!;
    if (current.start < last.end || current.start - last.end <= maxMergeGap) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ start: current.start, end: current.end });
    }
  }
  return merged;
}

/**
 * Creates a Voice Activity Detection runner for executing local FSMN-VAD models.
 *
 * It loads the model, validates its input/output signature, pre-allocates the
 * static output tensor and registers a disposal hook. The whole pipeline —
 * feature extraction, chunked inference and segment postprocessing — runs in
 * TypeScript on top of the core `model.execute` primitive.
 *
 * The model exposes a dynamic frame dimension: each forward pass accepts
 * `[frames, 512]` (up to the model-declared maximum) and returns per-frame class
 * probabilities. Long inputs are split into chunks; a short final chunk is
 * zero-padded up to the model minimum and its padding scores are discarded.
 * @category Typescript API
 * @param config VAD task configuration containing the model path.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to an object containing detection and disposal
 * controls.
 */
export async function createVAD(
  config: VADModel,
  runtime?: WorkletRuntime
): Promise<{
  /**
   * Releases all allocated native resources.
   */
  dispose: () => void;
  /**
   * Asynchronously detects speech segments within a mono 16 kHz waveform.
   * @param waveform The input audio samples.
   * @param options Optional per-call overrides of the detection thresholds.
   * @returns A promise resolving to the detected speech segments, in seconds.
   */
  detect: (waveform: Float32Array, options?: VADOptions) => Promise<Segment[]>;
  /**
   * Synchronous version of {@link detect} to be executed directly on the caller
   * or worklet thread.
   */
  detectWorklet: (waveform: Float32Array, options?: VADOptions) => Segment[];
}> {
  const { modelPath } = config;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  // Input: [frames, 512] with a dynamic frame count. Output: per-frame class
  // probabilities, either [1, frames, classes] or [frames, classes]. Class 0 is
  // the non-speech class.
  const meta = validateModelSchema(
    model,
    'forward',
    [SymbolicTensor('float32', ['N', PADDED_WINDOW_SIZE])],
    [SymbolicTensor('float32', [1, 'F', 'C'], ['F', 'C'])]
  );
  const maxFrames = meta.inputTensorMeta[0]!.shape[0]!;
  const outShape = meta.outputTensorMeta[0]!.shape;
  const numClass = outShape[outShape.length - 1]!;

  // The output tensor is validated against the declared shape exactly, so it is
  // pre-allocated once at that shape. Its frame capacity caps the chunk size so
  // a full chunk's output can never overflow it.
  const tensors = [tensor('float32', outShape)] as const;
  const [tOutput] = tensors;
  const outBuffer = new Float32Array(tOutput.numel);
  const chunkCapacity = Math.min(maxFrames, Math.floor(tOutput.numel / numClass));

  const hann = hannWindow(WINDOW_SIZE);

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    model.dispose();
  };

  const detectWorklet = (waveform: Float32Array, options?: VADOptions): Segment[] => {
    'worklet';
    if (waveform.length < WINDOW_SIZE) return [];

    const opts: ResolvedOptions = { ...DEFAULT_OPTIONS, ...options };
    const frames = frameWaveform(waveform, hann);
    const numFrames = frames.length / PADDED_WINDOW_SIZE;
    if (numFrames === 0) return [];

    const scores = new Float32Array(numFrames);
    let offset = 0;
    while (offset < numFrames) {
      const realFrames = Math.min(numFrames - offset, chunkCapacity);
      const chunkFrames = Math.max(realFrames, MIN_MODEL_FRAMES);
      const chunkData = new Float32Array(chunkFrames * PADDED_WINDOW_SIZE);
      const from = offset * PADDED_WINDOW_SIZE;
      const to = (offset + realFrames) * PADDED_WINDOW_SIZE;
      chunkData.set(frames.subarray(from, to));
      const tInput = tensor('float32', [chunkFrames, PADDED_WINDOW_SIZE], chunkData);
      try {
        model.execute('forward', [tInput], [tOutput]);
        tOutput.getData(outBuffer);
        for (let i = 0; i < realFrames; i++) {
          scores[offset + i] = outBuffer[i * numClass]!;
        }
      } finally {
        tInput.dispose();
      }
      offset += realFrames;
    }

    const raw = scoresToSegments(scores, opts);
    const merged = mergeSegments(raw, opts.mergeGapMs * SAMPLES_PER_MS);
    return merged.map((s) => ({ start: s.start / SAMPLE_RATE, end: s.end / SAMPLE_RATE }));
  };

  const detect = wrapAsync(detectWorklet, runtime);

  return { detect, detectWorklet, dispose };
}
