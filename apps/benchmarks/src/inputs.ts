/**
 * Deterministic synthetic inputs.
 *
 * Every input here is a pure function of its arguments, so two runs on the same
 * device feed byte-identical data to the models. That matters more than realism
 * for a regression harness: post-processing cost is input-dependent (an NMS pass
 * over 200 candidate boxes is not the same work as over 3), so a benchmark that
 * picked an image from the gallery would move for reasons that have nothing to
 * do with the change under test.
 *
 * The image is a structured scene rather than noise for the same reason. Pure
 * noise drives detectors into pathological candidate counts that are unlike any
 * real workload; a few solid blobs on a gradient produce a small, stable set of
 * detections.
 */

import type { cv } from 'react-native-executorch';

type ImageBuffer = cv.ImageBuffer;

/* eslint-disable no-bitwise -- the hash below is defined in terms of them */

/**
 * mulberry32 — small, fast, and identical across every JS engine.
 * @param seed The generator's starting state.
 * @returns A function yielding successive values in `[0, 1)`.
 */
function prng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* eslint-enable no-bitwise */

interface Blob {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly rgb: readonly [number, number, number];
}

// Positions are fractions of the frame so the same scene renders at any size.
const BLOBS: readonly Blob[] = [
  { cx: 0.3, cy: 0.42, rx: 0.17, ry: 0.26, rgb: [210, 96, 72] },
  { cx: 0.66, cy: 0.6, rx: 0.13, ry: 0.19, rgb: [72, 140, 200] },
  { cx: 0.5, cy: 0.82, rx: 0.28, ry: 0.11, rgb: [96, 176, 108] },
];

/**
 * Builds an RGBA/HWC image buffer holding a fixed synthetic scene: a vertical
 * gradient, three solid ellipses, and a light deterministic dither so the image
 * is not perfectly flat.
 * @param width Frame width in pixels.
 * @param height Frame height in pixels.
 * @param seed Seed for the dither. Same seed and size means the same bytes.
 * @returns The image buffer, ready to pass to any vision task.
 */
export function syntheticImage(width: number, height: number, seed = 0x5eed): ImageBuffer {
  const data = new Uint8Array(width * height * 4);
  const random = prng(seed);

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;

      let r = 40 + 150 * v;
      let g = 60 + 120 * u;
      let b = 150 - 80 * v;

      for (const blob of BLOBS) {
        const dx = (u - blob.cx) / blob.rx;
        const dy = (v - blob.cy) / blob.ry;
        if (dx * dx + dy * dy <= 1) {
          [r, g, b] = blob.rgb;
          break;
        }
      }

      const dither = (random() - 0.5) * 12;
      const i = (y * width + x) * 4;
      data[i] = Math.max(0, Math.min(255, Math.round(r + dither)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(g + dither)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(b + dither)));
      data[i + 3] = 255;
    }
  }

  return { data, width, height, format: 'rgba', layout: 'hwc' };
}

/**
 * Builds a mono waveform alternating voiced-like bursts with silence.
 *
 * The bursts are a small harmonic stack under a syllable-rate envelope, which
 * lands in the band voice-activity detection keys off, so the VAD produces a
 * stable non-trivial segmentation instead of either "all speech" or "none".
 * It is not speech, and no speech-recognition model will transcribe meaning
 * from it — see the note on `speechToText` in `src/suite.ts`.
 * @param seconds Waveform length in seconds.
 * @param sampleRate Samples per second.
 * @returns Float32 PCM samples normalized to `[-1, 1]`.
 */
export function syntheticWaveform(seconds: number, sampleRate: number): Float32Array {
  const samples = new Float32Array(Math.round(seconds * sampleRate));
  const random = prng(0xa11d10);

  // 0.6 s of burst followed by 0.4 s of near-silence, repeating.
  const periodSamples = sampleRate;
  const burstSamples = Math.round(0.6 * sampleRate);

  for (let i = 0; i < samples.length; i++) {
    const phaseInPeriod = i % periodSamples;
    const t = i / sampleRate;

    if (phaseInPeriod >= burstSamples) {
      samples[i] = (random() - 0.5) * 0.002;
      continue;
    }

    // Syllable-rate amplitude envelope over a 140 Hz fundamental plus formants.
    const envelope = 0.5 - 0.5 * Math.cos((2 * Math.PI * phaseInPeriod) / burstSamples);
    const voiced =
      Math.sin(2 * Math.PI * 140 * t) +
      0.5 * Math.sin(2 * Math.PI * 700 * t) +
      0.3 * Math.sin(2 * Math.PI * 1220 * t) +
      0.15 * Math.sin(2 * Math.PI * 2600 * t);

    samples[i] = 0.22 * envelope * voiced + (random() - 0.5) * 0.01;
  }

  return samples;
}

/** Fixed prose used by the text pipelines. Long enough to fill a few chunks. */
export const SAMPLE_TEXT =
  'React Native ExecuTorch runs machine learning models directly on device, ' +
  'without sending user data to a server. The runtime loads a compiled program, ' +
  'resolves the delegates it was exported against, and executes it against ' +
  'pre-allocated tensors so that inference costs no allocations per frame.';

/** Fixed text seeded with the entity types a PII detector is expected to find. */
export const SAMPLE_PII_TEXT =
  'Please forward the signed contract to Dana Whitfield at dana.whitfield@example.com ' +
  'or call 555-0142 before Friday. The office is at 118 Ellis Street, Portland, and ' +
  'the account number on file is 4029 1183 5567 2210.';
