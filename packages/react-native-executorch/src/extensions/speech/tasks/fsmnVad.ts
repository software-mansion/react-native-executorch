import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';
import { frameWaveform } from '../ops';

/**
 * Feature-extraction geometry describing how a raw waveform is turned into the
 * per-frame input a VAD model expects. These values are model-specific — they
 * must match how the `.pte` was trained — and are supplied by the model config
 * (see the `models` registry), not hardcoded in the pipeline.
 * @category Types
 * @property {number} sampleRate - Expected input sample rate in Hz (e.g. `16000`).
 * @property {number} frameLength - Analysis window length in samples (e.g. `400`, 25 ms).
 * @property {number} hopLength - Samples between consecutive windows (e.g. `160`, 10 ms).
 * @property {number} fftLength - Zero-padded window length fed to the model (e.g. `512`).
 * @property {number} preemphasis - Pre-emphasis filter coefficient (e.g. `0.97`).
 * @property {number} minFrames - Minimum frames the model accepts per forward pass (e.g. `100`).
 */
export type VADFeatureConfig = {
  readonly sampleRate: number;
  readonly frameLength: number;
  readonly hopLength: number;
  readonly fftLength: number;
  readonly preemphasis: number;
  readonly minFrames: number;
};

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
 * @property {string} modelPath - Local path or remote URL of the `.pte` model.
 * @property {VADFeatureConfig} featureConfig - Model-specific feature-extraction
 * geometry.
 * @property {VADOptions} [defaultOptions] - Detection thresholds tuned for this
 * model; overridable per `detect` call. Falls back to the library defaults.
 */
export type FsmnVadModel = {
  readonly modelPath: string;
  readonly featureConfig: VADFeatureConfig;
  readonly defaultOptions?: VADOptions;
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
 * Options controlling a streaming detection session. Extends the per-call
 * detection thresholds ({@link VADOptions}) with streaming-specific tuning.
 * @category Types
 * @property {number} [detectionMargin] - How recent (in milliseconds) the last
 * detected speech segment must reach toward the end of the window for speech to
 * still be considered ongoing. Defaults to `100`.
 */
export type VADStreamOptions = VADOptions & {
  readonly detectionMargin?: number;
};

/**
 * Emitted by the {@link VADStreamOptions} generator on every speech begin/end
 * transition.
 * @category Types
 * @property {boolean} isSpeaking - `true` when speech has just started, `false`
 * when it has just ended.
 */
export type VADStreamEvent = {
  readonly isSpeaking: boolean;
};

type ResolvedOptions = Required<VADOptions>;

// Library fallback thresholds (Silero-style). A model may override any of these
// via `FsmnVadModel.defaultOptions`, and callers via the `detect` options argument.
const DEFAULT_OPTIONS: ResolvedOptions = {
  speechThreshold: 0.6,
  minSpeechDurationMs: 250,
  minSilenceDurationMs: 100,
  speechPadMs: 30,
  mergeGapMs: 0,
};

// Detection runs over a bounded window of the most recent audio (not the whole
// growing session): model cost scales with window length, and 2.5s already
// exceeds FSMN's receptive field (~200ms) and the min-speech duration (250ms).
const DETECTION_WINDOW_SECONDS = 2.5;
const DEFAULT_DETECTION_MARGIN_MS = 100;

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

// Converts per-frame non-speech probabilities into padded speech segments in
// sample units. Mirrors `VoiceActivityDetection::postprocess` (excluding the
// final merge step). `scores[i]` holds the non-speech probability of frame `i`,
// so the speech probability is `1 - scores[i]`.
function scoresToSegments(
  scores: Float32Array,
  opts: ResolvedOptions,
  hopLength: number,
  hopLengthMs: number
): SampleSegment[] {
  'worklet';
  const threshold = opts.speechThreshold;
  const minSpeechHops = Math.floor(opts.minSpeechDurationMs / hopLengthMs);
  const minSilenceHops = Math.floor(opts.minSilenceDurationMs / hopLengthMs);
  const speechPadHops = Math.floor(opts.speechPadMs / hopLengthMs);

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
    segment.start = (segment.start > speechPadHops ? segment.start - speechPadHops : 0) * hopLength;
    segment.end = Math.min(segment.end + speechPadHops, scores.length) * hopLength;
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
 * Creates a Voice Activity Detection runner for executing local VAD models.
 *
 * It loads the model, validates its input/output signature, pre-allocates the
 * static output tensor and registers a disposal hook. The whole pipeline —
 * feature extraction, chunked inference and segment postprocessing — runs in
 * TypeScript on top of the core `model.execute` primitive, parameterized by the
 * model's {@link VADFeatureConfig}.
 *
 * The model exposes a dynamic frame dimension: each forward pass accepts
 * `[frames, fftLength]` (up to the model-declared maximum) and returns per-frame
 * class probabilities. Long inputs are split into chunks; a short final chunk is
 * zero-padded up to the model minimum and its padding scores are discarded.
 * @category Typescript API
 * @param config VAD task configuration containing the model path and feature
 * config.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to an object containing detection and disposal
 * controls.
 */
export async function createFsmnVad(
  config: FsmnVadModel,
  runtime?: WorkletRuntime
): Promise<{
  /**
   * Releases all allocated native resources.
   */
  dispose: () => void;
  /**
   * Asynchronously detects speech segments within a mono waveform sampled at the
   * model's configured sample rate.
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
  /**
   * Starts a live streaming session and returns an async generator that yields
   * a {@link VADStreamEvent} on every speech begin/end transition. Feed audio
   * with {@link createFsmnVad}'s `streamInsert` and end the session with
   * `streamStop`. Throws if a session is already in progress.
   */
  stream: (options?: VADStreamOptions) => AsyncGenerator<VADStreamEvent>;
  /**
   * Appends a mono audio chunk to the active streaming buffer and wakes the
   * stream generator. Throws if no session is in progress.
   */
  streamInsert: (audioChunk: Float32Array) => void;
  /**
   * Stops the active streaming session. Throws if no session is in progress.
   */
  streamStop: () => void;
}> {
  const { modelPath, featureConfig: fc } = config;
  const samplesPerMs = fc.sampleRate / 1000;
  const hopLengthMs = fc.hopLength / samplesPerMs;
  const modelDefaults: ResolvedOptions = { ...DEFAULT_OPTIONS, ...config.defaultOptions };

  const model = await wrapAsync(loadModel, runtime)(modelPath);

  // Input: [frames, fftLength] with a dynamic frame count. Output: per-frame
  // class probabilities, either [1, frames, classes] or [frames, classes]. Class
  // 0 is the non-speech class.
  const meta = validateModelSchema(
    model,
    'forward',
    [SymbolicTensor('float32', ['N', fc.fftLength])],
    [SymbolicTensor('float32', [1, 'F', 'C'], ['F', 'C'])]
  );
  const maxFrames = meta.inputTensorMeta[0]!.shape[0]!;
  const outShape = meta.outputTensorMeta[0]!.shape;
  const numClass = outShape[outShape.length - 1]!;

  // The output tensor is validated against the declared shape exactly, so it is
  // pre-allocated once at that shape. Its frame capacity caps the chunk size so
  // a full chunk's output can never overflow it. The Hann window is uploaded
  // once and reused by the native framing op across every call.
  const tensors = [
    tensor('float32', outShape),
    tensor('float32', [fc.frameLength], hannWindow(fc.frameLength)),
  ] as const;
  const [tOutput, tHann] = tensors;
  const outBuffer = new Float32Array(tOutput.numel);
  const chunkCapacity = Math.min(maxFrames, Math.floor(tOutput.numel / numClass));

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    model.dispose();
  };

  const detectWorklet = (waveform: Float32Array, options?: VADOptions): Segment[] => {
    'worklet';
    if (waveform.length < fc.frameLength) return [];

    const opts: ResolvedOptions = { ...modelDefaults, ...options };
    const numFrames = Math.floor((waveform.length - fc.frameLength) / fc.hopLength);
    if (numFrames <= 0) return [];

    const scores = new Float32Array(numFrames);
    // Upload the waveform once; the native op frames slices of it per chunk.
    const tWaveform = tensor('float32', [waveform.length], waveform);
    try {
      let offset = 0;
      while (offset < numFrames) {
        const realFrames = Math.min(numFrames - offset, chunkCapacity);
        const chunkFrames = Math.max(realFrames, fc.minFrames);
        const tInput = tensor('float32', [chunkFrames, fc.fftLength]);
        try {
          frameWaveform(
            tWaveform,
            tHann,
            tInput,
            offset * fc.hopLength,
            realFrames,
            fc.hopLength,
            fc.preemphasis
          );
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
    } finally {
      tWaveform.dispose();
    }

    const raw = scoresToSegments(scores, opts, fc.hopLength, hopLengthMs);
    const merged = mergeSegments(raw, opts.mergeGapMs * samplesPerMs);
    return merged.map((s) => ({ start: s.start / fc.sampleRate, end: s.end / fc.sampleRate }));
  };

  const detect = wrapAsync(detectWorklet, runtime);

  // Streaming mirrors the Whisper STT structure (createWhisperSpeechToText): a
  // pull-based async generator woken by `streamInsert`, no wall-clock polling.
  const windowSamples = DETECTION_WINDOW_SECONDS * fc.sampleRate;
  let isStreaming = false;
  let streamBuffer = new Float32Array(0);
  let totalInserted = 0;
  let signal: (() => void) | null = null;

  const streamInsert = (audioChunk: Float32Array): void => {
    if (!isStreaming) {
      throw new Error('Streaming is not in progress');
    }
    // Replace (never mutate) the buffer so a snapshot handed to a running
    // detection stays valid, and drop audio beyond the detection window.
    const next = new Float32Array(streamBuffer.length + audioChunk.length);
    next.set(streamBuffer);
    next.set(audioChunk, streamBuffer.length);
    streamBuffer = next.length > windowSamples ? next.slice(next.length - windowSamples) : next;
    totalInserted += audioChunk.length;
    signal?.();
    signal = null;
  };

  const streamStop = (): void => {
    if (!isStreaming) {
      throw new Error('Streaming is not in progress');
    }
    isStreaming = false;
    signal?.();
    signal = null;
  };

  async function* stream(options?: VADStreamOptions): AsyncGenerator<VADStreamEvent> {
    if (isStreaming) {
      throw new Error('Streaming is already in progress');
    }
    isStreaming = true;
    streamBuffer = new Float32Array(0);
    totalInserted = 0;

    const detectionMargin = options?.detectionMargin ?? DEFAULT_DETECTION_MARGIN_MS;
    let lastProcessed = 0;
    let speaking = false;

    try {
      while (isStreaming) {
        // Run detection once per fresh audio arrival; otherwise sleep until the
        // next `streamInsert` wakes us (event-driven, no polling).
        if (totalInserted <= lastProcessed) {
          await new Promise<void>((resolve) => (signal = resolve));
          continue;
        }

        const snapshot = streamBuffer;
        lastProcessed = totalInserted;
        const segments = await detect(snapshot, options);
        if (!isStreaming) break;

        // Speech is ongoing if the last detected segment reaches close enough to
        // the end of the window (within detectionMargin).
        let nowSpeaking = false;
        if (segments.length > 0) {
          const bufferEndSec = snapshot.length / fc.sampleRate;
          const diffMs = (bufferEndSec - segments[segments.length - 1]!.end) * 1000;
          nowSpeaking = diffMs <= detectionMargin;
        }

        if (nowSpeaking !== speaking) {
          speaking = nowSpeaking;
          yield { isSpeaking: speaking };
        }
      }
    } finally {
      isStreaming = false;
      signal = null;
    }
  }

  return { dispose, detect, detectWorklet, stream, streamStop, streamInsert };
}
