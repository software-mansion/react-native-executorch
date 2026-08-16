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
 * Builds a mono waveform alternating voice-like bursts with silence.
 *
 * Each burst is a glottal-style pulse train swept through three formant
 * resonances, with a band-limited noise component for the fricative energy a
 * pure harmonic stack lacks, under a syllable-rate envelope. It is not speech,
 * and no recognizer will transcribe meaning from it, but it carries enough of
 * speech's spectral shape for a voice-activity detector to open segments on the
 * bursts and close them on the gaps — which is what makes the VAD case exercise
 * its segmentation path rather than returning nothing.
 * @param seconds Waveform length in seconds.
 * @param sampleRate Samples per second.
 * @returns Float32 PCM samples normalized to `[-1, 1]`.
 */
export function syntheticWaveform(seconds: number, sampleRate: number): Float32Array {
  const samples = new Float32Array(Math.round(seconds * sampleRate));
  const random = prng(0xa11d10);

  // 0.7 s of burst followed by 0.3 s of near-silence, repeating.
  const periodSamples = sampleRate;
  const burstSamples = Math.round(0.7 * sampleRate);

  // Two-pole resonators, one per formant, driven by the pulse train and noise.
  const formants = [
    { hz: 700, bandwidth: 90, gain: 1.0 },
    { hz: 1220, bandwidth: 110, gain: 0.6 },
    { hz: 2600, bandwidth: 170, gain: 0.35 },
  ].map((formant) => {
    const r = Math.exp((-Math.PI * formant.bandwidth) / sampleRate);
    return {
      gain: formant.gain,
      a1: 2 * r * Math.cos((2 * Math.PI * formant.hz) / sampleRate),
      a2: -r * r,
      y1: 0,
      y2: 0,
    };
  });

  const pitchHz = 130;
  const samplesPerPulse = sampleRate / pitchHz;

  for (let i = 0; i < samples.length; i++) {
    const phaseInPeriod = i % periodSamples;

    if (phaseInPeriod >= burstSamples) {
      samples[i] = (random() - 0.5) * 0.002;
      // Let the resonators ring down rather than snapping to zero.
      for (const formant of formants) {
        const y = formant.a1 * formant.y1 + formant.a2 * formant.y2;
        formant.y2 = formant.y1;
        formant.y1 = y;
      }
      continue;
    }

    // Impulse train (voicing) plus aspiration noise, shaped by the formants.
    const sincePulse = phaseInPeriod % samplesPerPulse;
    const excitation = (sincePulse < 1 ? 1 : 0) + (random() - 0.5) * 0.35;

    let voiced = 0;
    for (const formant of formants) {
      const y = excitation + formant.a1 * formant.y1 + formant.a2 * formant.y2;
      formant.y2 = formant.y1;
      formant.y1 = y;
      voiced += formant.gain * y;
    }

    const envelope = 0.5 - 0.5 * Math.cos((2 * Math.PI * phaseInPeriod) / burstSamples);
    samples[i] = Math.max(-1, Math.min(1, 0.08 * envelope * voiced));
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
