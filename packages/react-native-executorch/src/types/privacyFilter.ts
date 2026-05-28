import { RnExecutorchError } from '../errors/errorUtils';
import { ResourceSource } from './common';

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
 * Per-model config for {@link PrivacyFilterModule.fromModelName}. Each
 * built-in `modelName` resolves to its baked-in label list and default
 * Viterbi biases; custom fine-tunes go through
 * {@link PrivacyFilterModule.fromCustomModel} instead.
 * @category Types
 */
export type PrivacyFilterModelSources =
  | {
      modelName: 'privacy-filter-openai';
      modelSource: ResourceSource;
      tokenizerSource: ResourceSource;
    }
  | {
      modelName: 'privacy-filter-nemotron';
      modelSource: ResourceSource;
      tokenizerSource: ResourceSource;
    };

/**
 * Union of all built-in privacy filter model names.
 * @category Types
 */
export type PrivacyFilterModelName = PrivacyFilterModelSources['modelName'];

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
   * sliding windows with 50% overlap; no truncation. The window size is
   * determined by the model's exported `forward` input shape.
   * @param text Input text.
   * @returns A promise resolving to detected entity spans.
   */
  generate(text: string): Promise<PiiEntity[]>;
}
