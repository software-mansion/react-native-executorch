import { RnExecutorchError } from '../errors/errorUtils';
import { ResourceSource } from './common';

/**
 * Union of all built-in privacy filter model names.
 * @category Types
 */
export type PrivacyFilterModelName =
  | 'privacy-filter-openai'
  | 'privacy-filter-nemotron';

/**
 * Six Viterbi transition biases that match the operating-point schema
 * from the openai/privacy-filter `viterbi_calibration.json`. Each value
 * is added to the decoder score whenever the corresponding BIOES
 * transition is taken.
 *
 * Positive values *encourage* the transition; negative values discourage
 * it. Defaults are zero (neutral validity-only Viterbi).
 * @category Types
 */
export interface ViterbiBiases {
  /** O -> O (background persistence). Higher = stay in background more, fewer false positives. */
  backgroundStay?: number;
  /** O -> B-* / S-* (span entry). Lower (negative) = enter spans more eagerly, higher recall. */
  backgroundToStart?: number;
  /** E-/S-* -> O (span closure to background). */
  endToBackground?: number;
  /** E-/S-* -> B-* / S-* (back-to-back spans). */
  endToStart?: number;
  /** B-/I-X -> I-X (span continuation). Higher = longer spans. */
  insideToContinue?: number;
  /** B-/I-X -> E-X (span closure). Higher = shorter spans. */
  insideToEnd?: number;
}

/**
 * Bundle of resources needed to instantiate a privacy filter model. The
 * built-in `PRIVACY_FILTER_OPENAI` / `PRIVACY_FILTER_NEMOTRON` constants
 * conform to this shape; you can also build one yourself for a custom
 * fine-tune as long as the label list matches the model's id2label.
 * @category Types
 */
export interface PrivacyFilterModelSources {
  modelName: PrivacyFilterModelName | (string & {});
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
  /**
   * BIOES label list. Index 0 must be "O"; index i must equal the model's
   * id2label[i]. The runner argmaxes over `labelNames.length` classes per
   * token, so the size must match the model head exactly.
   */
  labelNames: readonly string[];
  /**
   * Optional Viterbi calibration. When present, biases are added during
   * decoding to shift the precision/recall tradeoff. Defaults to all
   * zeros (neutral) — same as the `default` operating point in OpenAI's
   * `viterbi_calibration.json`.
   */
  viterbiBiases?: ViterbiBiases;
}

/**
 * A single detected PII entity span.
 * @category Types
 */
export interface PiiEntity {
  /** Entity type, e.g. `private_person`, `private_email`, `secret`. */
  label: string;
  /** Decoded text of the span (whitespace trimmed). */
  text: string;
  /** Inclusive start token index in the original (unpadded) tokenization. */
  startToken: number;
  /** Exclusive end token index. */
  endToken: number;
}

/**
 * Props for the usePrivacyFilter hook.
 * @category Types
 */
export interface PrivacyFilterProps {
  model: PrivacyFilterModelSources;
  preventLoad?: boolean;
}

/**
 * React hook state and methods for a Privacy Filter model.
 * @category Types
 */
export interface PrivacyFilterType {
  error: null | RnExecutorchError;
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  /**
   * Run PII detection over the given text. Long inputs are processed in
   * sliding 256-token windows with 128-token overlap; no truncation.
   * @param text Input text.
   * @returns A promise resolving to detected entity spans.
   */
  generate(text: string): Promise<PiiEntity[]>;
}
