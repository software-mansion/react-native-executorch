/**
 * Splitting long recordings into pieces a speech-to-text model takes in one pass.
 */

import type { VadSegment } from '../tasks/fsmnVoiceActivityDetection';

const SAMPLE_RATE_HZ = 16000;
const SPLIT_SEARCH_SAMPLES = 5 * SAMPLE_RATE_HZ; // how far back to look for a quiet cut
const ENERGY_WINDOW_SAMPLES = SAMPLE_RATE_HZ / 10; // 100 ms energy window for the cut
// VAD frames (25 ms, 10 ms hop) stop up to this far short of the end of the
// audio, so speech reaching the last frame is taken to reach the end.
const VAD_TAIL_SAMPLES = 560;

/**
 * Finds the quietest 100 ms within the last 5 s before `limit` and returns the
 * sample in its middle.
 * @param audio Input waveform.
 * @param start First sample the cut may follow.
 * @param limit Last sample the cut may fall on.
 * @returns The cut sample, in `(start, limit]`.
 */
function quietestCut(audio: Float32Array, start: number, limit: number): number {
  'worklet';
  const from = Math.max(start + ENERGY_WINDOW_SAMPLES, limit - SPLIT_SEARCH_SAMPLES);
  let energy = 0;
  for (let i = from - ENERGY_WINDOW_SAMPLES; i < from; i++) energy += audio[i]! * audio[i]!;
  let best = from;
  let bestEnergy = energy;
  for (let end = from + 1; end <= limit; end++) {
    const enter = audio[end - 1]!;
    const leave = audio[end - 1 - ENERGY_WINDOW_SAMPLES]!;
    energy += enter * enter - leave * leave;
    if (energy < bestEnergy) {
      bestEnergy = energy;
      best = end;
    }
  }
  return best - ENERGY_WINDOW_SAMPLES / 2;
}

/**
 * Splits `audio` into pieces of at most `maxSamples` that cover its speech.
 * Each piece ends at the last speech gap that fits, so words stay whole; a
 * single stretch of speech longer than the limit is cut at its quietest
 * 100 ms instead. Silence between pieces, and before and after the speech, is
 * dropped.
 * @param audio Input waveform, 16 kHz mono.
 * @param speech Speech segments in `audio`, in seconds, as the VAD reports them.
 * @param maxSamples Longest piece the model accepts.
 * @returns `[start, end)` sample ranges, in order; empty when there is no speech.
 */
export function splitAtSpeechGaps(
  audio: Float32Array,
  speech: VadSegment[],
  maxSamples: number
): [number, number][] {
  'worklet';
  const segments = speech.map((s): [number, number] => [
    Math.max(0, Math.round(s.start * SAMPLE_RATE_HZ)),
    Math.min(audio.length, Math.round(s.end * SAMPLE_RATE_HZ)),
  ]);
  const last = segments[segments.length - 1];
  if (last && audio.length - last[1] <= VAD_TAIL_SAMPLES) last[1] = audio.length;

  const pieces: [number, number][] = [];
  let i = 0;
  while (i < segments.length) {
    const start = segments[i]![0];
    const limit = start + maxSamples;
    if (segments[i]![1] > limit) {
      const cut = quietestCut(audio, start, limit);
      pieces.push([start, cut]);
      segments[i]![0] = cut;
      continue;
    }
    while (i + 1 < segments.length && segments[i + 1]![1] <= limit) i++;
    pieces.push([start, segments[i]![1]]);
    i++;
  }
  return pieces;
}
