import type { Segment } from './tasks/vad';

const SAMPLE_RATE = 16000;
// Bound the streaming buffer so continuous input cannot grow it without limit.
// When it exceeds the cap, only the most recent samples are kept (mirrors the
// native streaming buffer trimming).
const MAX_BUFFER_SAMPLES = 10 * SAMPLE_RATE; // 10 s
const RESERVE_SAMPLES = 1 * SAMPLE_RATE; // 1 s kept after trimming

/**
 * Options controlling the streaming detection loop.
 * @category Types
 * @property {number} [timeout] - Delay in milliseconds between successive
 * inferences over the accumulated buffer. Defaults to `100`.
 * @property {number} [detectionMargin] - How recent (in milliseconds) the last
 * detected speech segment must be, relative to the end of the buffer, for speech
 * to still be considered ongoing. Defaults to `100`.
 * @property {() => void | Promise<void>} [onSpeechBegin] - Called when speech
 * starts (silence to speech transition).
 * @property {() => void | Promise<void>} [onSpeechEnd] - Called when speech ends
 * (speech to silence transition).
 */
export type VADStreamOptions = {
  readonly timeout?: number;
  readonly detectionMargin?: number;
  readonly onSpeechBegin?: () => void | Promise<void>;
  readonly onSpeechEnd?: () => void | Promise<void>;
};

/**
 * A live streaming VAD session driving speech begin/end callbacks.
 * @category Types
 */
export type VADStreamer = {
  /** Starts the detection loop. Resolves once the session is stopped. */
  start: () => Promise<void>;
  /** Appends an audio chunk to the streaming buffer. */
  insert: (chunk: Float32Array) => void;
  /** Stops the detection loop and clears the buffer. */
  stop: () => void;
};

/**
 * Creates a pure (React-independent) streaming VAD session on top of a `detect`
 * function (typically `createVAD(...).detect`).
 *
 * It accumulates inserted audio into an internal buffer and, every `timeout`
 * milliseconds, runs detection over the buffer and fires `onSpeechBegin` /
 * `onSpeechEnd` on transitions. Ticks never overlap: the next tick is scheduled
 * only after the previous detection resolves. Ported from
 * `VoiceActivityDetection::stream`.
 * @category Typescript API
 * @param detect The async detection function to run over the buffer.
 * @param options Streaming configuration and callbacks.
 * @returns A {@link VADStreamer} controlling the session lifecycle.
 */
export function createVadStreamer(
  detect: (waveform: Float32Array) => Promise<Segment[]>,
  options?: VADStreamOptions
): VADStreamer {
  const timeout = options?.timeout ?? 100;
  const detectionMargin = options?.detectionMargin ?? 100;

  let buffer = new Float32Array(0);
  let running = false;
  let isSpeaking = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let resolveFinished: (() => void) | null = null;

  const insert = (chunk: Float32Array) => {
    // `buffer` is replaced (never mutated in place), so any snapshot handed to a
    // running detection stays valid.
    const next = new Float32Array(buffer.length + chunk.length);
    next.set(buffer);
    next.set(chunk, buffer.length);
    buffer = next.length > MAX_BUFFER_SAMPLES ? next.slice(next.length - RESERVE_SAMPLES) : next;
  };

  const tick = async () => {
    if (!running) return;

    let speaking = false;
    const snapshot = buffer;
    try {
      const segments = await detect(snapshot);
      if (segments.length > 0) {
        const bufferEndSec = snapshot.length / SAMPLE_RATE;
        const diffMs = (bufferEndSec - segments[segments.length - 1]!.end) * 1000;
        speaking = diffMs <= detectionMargin;
      }
    } catch {
      // Detection may throw if the model is disposed mid-stream; treat as
      // non-speech and let the next tick (if any) recover.
    }

    if (!running) return;

    if (speaking && !isSpeaking) {
      isSpeaking = true;
      await options?.onSpeechBegin?.();
    } else if (!speaking && isSpeaking) {
      isSpeaking = false;
      await options?.onSpeechEnd?.();
    }

    if (running) timer = setTimeout(tick, timeout);
  };

  const start = () =>
    new Promise<void>((resolve) => {
      if (running) {
        resolve();
        return;
      }
      running = true;
      resolveFinished = resolve;
      timer = setTimeout(tick, timeout);
    });

  const stop = () => {
    running = false;
    if (timer) clearTimeout(timer);
    timer = null;
    buffer = new Float32Array(0);
    isSpeaking = false;
    resolveFinished?.();
    resolveFinished = null;
  };

  return { start, insert, stop };
}
