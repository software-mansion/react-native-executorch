/**
 * Utility functions, vocoder constants, and voice decoders for Kokoro TTS.
 */

/**
 * Number of audio samples generated per single predicted duration tick.
 * @category Speech / Constants
 */
export const KOKORO_TICKS_PER_DURATION = 600;

/**
 * Length of a single Kokoro voice reference vector (one row of a voice file).
 * @category Speech / Constants
 */
export const KOKORO_VOICE_REF_SIZE = 256;

const PAD_TOKEN = 0n;

// IPA phoneme -> Kokoro vocabulary token id. Phonemes absent from the map are
// dropped at tokenization time.
// prettier-ignore
const VOCAB: Record<string, number> = {
  ';': 1, ':': 2, ',': 3, '.': 4, '!': 5, '?': 6, '—': 9, '…': 10, '"': 11, '(': 12, ')': 13,
  '“': 14, '”': 15, ' ': 16, '\u0303': 17, 'ʣ': 18, 'ʥ': 19, 'ʦ': 20, 'ʨ': 21, 'ᵝ': 22,
  '\uab67': 23, 'A': 24, 'I': 25, 'O': 31, 'Q': 33, 'S': 35, 'T': 36, 'W': 39, 'Y': 41, 'ᵊ': 42,
  'a': 43, 'b': 44, 'c': 45, 'd': 46, 'e': 47, 'f': 48, 'h': 50, 'i': 51, 'j': 52, 'k': 53,
  'l': 54, 'm': 55, 'n': 56, 'o': 57, 'p': 58, 'q': 59, 'r': 60, 's': 61, 't': 62, 'u': 63,
  'v': 64, 'w': 65, 'x': 66, 'y': 67, 'z': 68, 'ɑ': 69, 'ɐ': 70, 'ɒ': 71, 'æ': 72, 'β': 75,
  'ɔ': 76, 'ɕ': 77, 'ç': 78, 'ɖ': 80, 'ð': 81, 'ʤ': 82, 'ə': 83, 'ɚ': 85, 'ɛ': 86, 'ɜ': 87,
  'ɟ': 90, 'ɡ': 92, 'ɥ': 99, 'ɨ': 101, 'ɪ': 102, 'ʝ': 103, 'ɯ': 110, 'ɰ': 111, 'ŋ': 112,
  'ɳ': 113, 'ɲ': 114, 'ɴ': 115, 'ø': 116, 'ɸ': 118, 'θ': 119, 'œ': 120, 'ɹ': 123, 'ɾ': 125,
  'ɻ': 126, 'ʁ': 128, 'ɽ': 129, 'ʂ': 130, 'ʃ': 131, 'ʈ': 132, 'ʧ': 133, 'ʊ': 135, 'ʋ': 136,
  'ʌ': 138, 'ɣ': 139, 'ɤ': 140, 'χ': 142, 'ʎ': 143, 'ʒ': 147, 'ʔ': 148, 'ˈ': 156, 'ˌ': 157,
  'ː': 158, 'ʰ': 162, 'ʲ': 164, '↓': 169, '→': 171, '↗': 172, '↘': 173, 'ᵻ': 177
};

/**
 * Silence (in milliseconds) appended after a chunk ending with a given phoneme,
 * so pauses between subsentences sound natural. Phonemes absent from the map
 * get no pause.
 * @category Speech / Constants
 */
// prettier-ignore
export const KOKORO_PAUSE_MS: Record<string, number> = {
  '.': 375, '?': 500, '!': 250, ';': 400, '…': 600, ',': 130, ':': 250, '-': 200,
  '—': 250, '|': 375, '।': 375, '॥': 500, '¿': 50, '¡': 50,
  '«': 50, '»': 100,
};

// Character -> 6-bit value table backing the voice file decoder below.
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP = /* @__PURE__ */ (() => {
  const lookup = new Int8Array(128).fill(-1);
  for (let i = 0; i < BASE64_ALPHABET.length; i++) lookup[BASE64_ALPHABET.charCodeAt(i)] = i;
  return lookup;
})();

/**
 * Parses a base64-encoded Kokoro voice file into its raw float rows. Each row
 * holds a {@link KOKORO_VOICE_REF_SIZE}-long reference vector for one input
 * token count.
 * @category Speech / Functions
 * @param base64 The base64 contents of the voice `.bin` file.
 * @returns The flattened voice matrix, row-major.
 */
export function parseVoice(base64: string): Float32Array {
  'worklet';
  /* eslint-disable no-bitwise */
  const bytes = new Uint8Array((base64.length * 3) >> 2);

  let buffer = 0;
  let bits = 0;
  let next = 0;
  for (let i = 0; i < base64.length; i++) {
    const code = base64.charCodeAt(i);
    const value = code < 128 ? BASE64_LOOKUP[code]! : -1;
    if (value < 0) continue;

    buffer = ((buffer << 6) | value) & 0xffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[next++] = (buffer >> bits) & 0xff;
    }
  }

  return new Float32Array(bytes.buffer, 0, next >> 2);
  /* eslint-enable no-bitwise */
}

/**
 * Maps phonemes to vocabulary tokens, padded with the pad token on both ends.
 * @category Speech / Functions
 * @param phonemes The phoneme sequence, split into code points.
 * @param totalLength The exact token count to produce, including padding.
 * @returns Token ids ready to be written into an `int64` tensor.
 */
export function tokenize(phonemes: string[], totalLength: number): BigInt64Array {
  'worklet';
  const tokens = new BigInt64Array(totalLength).fill(PAD_TOKEN);
  const count = Math.min(totalLength - 2, phonemes.length);

  let next = 1;
  for (let i = 0; i < count; i++) {
    const token = VOCAB[phonemes[i]!];
    if (token !== undefined) tokens[next++] = BigInt(token);
  }

  return tokens;
}

/**
 * Scales per-token durations in place so that they sum up exactly to
 * `targetDuration`, distributing the rounding error by largest remainder.
 * @category Speech / Functions
 * @param durations The per-token durations to scale in place.
 * @param targetDuration The exact sum the scaled durations must add up to.
 */
export function scaleDurations(durations: Int32Array, targetDuration: number): void {
  'worklet';
  let total = 0;
  for (const duration of durations) total += duration;
  if (total === 0) return;

  const scale = targetDuration / total;
  const shrinking = scale < 1;
  const remainders: { remainder: number; index: number }[] = [];

  let scaledSum = 0;
  for (let i = 0; i < durations.length; i++) {
    const scaled = scale * durations[i]!;
    const rounded = shrinking ? Math.ceil(scaled) : Math.floor(scaled);
    durations[i] = rounded;
    scaledSum += rounded;
    remainders.push({ remainder: Math.abs(rounded - scaled), index: i });
  }

  remainders.sort((a, b) => b.remainder - a.remainder);
  const diff = Math.abs(targetDuration - scaledSum);
  for (let i = 0; i < diff && i < remainders.length; i++) {
    const { index } = remainders[i]!;
    durations[index] = durations[index]! + (shrinking ? -1 : 1);
  }
}

// Finds the first (or, when scanning in reverse, the last) sample whose moving
// average amplitude rises above the silence threshold.
function findAudioBound(
  audio: Float32Array,
  reverse: boolean,
  steps: number,
  threshold: number
): number {
  'worklet';
  const length = audio.length;
  const normalize = (sample: number) => Math.max(0, Math.abs(sample) - threshold);

  let windowSum = 0;
  let index = reverse ? length - 1 : 0;
  for (let processed = 1; processed <= length; processed++) {
    windowSum += normalize(audio[index]!);
    if (processed > steps) {
      windowSum -= normalize(audio[reverse ? index + steps : index - steps]!);
    }
    if (processed >= steps && windowSum / steps >= threshold) return index;
    index += reverse ? -1 : 1;
  }

  return reverse ? 0 : length - 1;
}

/**
 * Strips leading and trailing silence using a sliding-window moving average.
 * @category Speech / Functions
 * @param audio The audio samples to strip.
 * @param margin The number of silence samples to preserve at each edge.
 * @param steps The moving average window length.
 * @param threshold The amplitude below which audio counts as silence.
 * @returns A view of `audio` with the silent edges removed.
 */
export function stripAudio(
  audio: Float32Array,
  margin: number,
  steps: number = 10,
  threshold: number = 0.005
): Float32Array {
  'worklet';
  if (audio.length === 0) return audio;

  const start = Math.max(0, findAudioBound(audio, false, steps, threshold) - margin);
  const end = Math.min(audio.length - 1, findAudioBound(audio, true, steps, threshold) + margin);

  return end >= start ? audio.subarray(start, end + 1) : audio.subarray(0, 0);
}
