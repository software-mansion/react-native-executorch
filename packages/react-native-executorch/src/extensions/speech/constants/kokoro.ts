/**
 * Tuning constants for the Kokoro text-to-speech pipeline.
 */

/** Sample rate (Hz) of the audio produced by the Kokoro synthesizer. */
export const SAMPLE_RATE = 24000;

/** Audio samples produced per duration frame by the synthesizer. */
export const SAMPLES_PER_FRAME = 600;

/** Number of padding tokens wrapping each tokenized segment (one per side). */
export const PAD_TOKEN_COUNT = 2;

/**
 * Arguments for {@link crop}, which strips leading/trailing silence from each
 * generated audio chunk.
 */
export const CROP_STEPS = 20; // Moving-average window size (samples).
export const CROP_THRESHOLD = 0.001; // Amplitude floor for "non-silent".
export const CROP_MARGIN = 1000; // Samples of audio kept on each side.

/**
 * Trailing-silence durations (in milliseconds) keyed by the punctuation
 * character that ends a segment. Mirrors the native `kPauseValues` table.
 */
export const PAUSE_MS: Record<string, number> = {
  '.': 320,
  '?': 400,
  '!': 220,
  ';': 380,
  '…': 550, // Ellipsis
  ',': 130,
  ':': 250,
  '-': 200,
  '—': 250, // Em dash (slightly longer than hyphen)
  '|': 325, // ASCII pipe (treated as a full stop)
  '।': 325, // Hindi Purna Viram
  '॥': 475, // Hindi Deergh Viram (typically longer than Purna Viram)
  '¿': 50, // Spanish inverted question mark (short preparatory pause)
  '¡': 50, // Spanish inverted exclamation mark (short preparatory pause)
  '«': 50, // Guillemet open (short pause)
  '»': 100, // Guillemet close (short pause)
};

/**
 * A small amount of pause applied by default if segment ends
 * with a non-standard pause character or white space.
 */
export const DEFAULT_PAUSE_MS = 10;
