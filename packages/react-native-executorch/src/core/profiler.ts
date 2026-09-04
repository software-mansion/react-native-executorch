/**
 * How much of a run was spent inside ExecuTorch.
 *
 * Every `execute` call adds its duration to a process-global tally, keyed by
 * method name. Read it around a piece of work to learn what share of that work
 * was the model, as opposed to the preprocessing and post-processing around it.
 *
 * This exists because the alternative does not work. A task pipeline owns its
 * `Model` privately, so there is no handle to time; and re-running the model
 * separately means guessing the shapes the pipeline fed it. For a model with a
 * dynamic dimension the guess is wrong by construction: a text embedder
 * declaring up to 510 tokens gets benchmarked at 510 while the pipeline ran 75,
 * and the resulting "share" is meaningless. Accumulating in place removes the
 * guess entirely, and it works for a pipeline that calls one method many times
 * (OCR recognises once per detected box) where a single replay would not.
 */

import { rnexecutorchJsi } from '../native/bridge';

/** What one exported method accumulated since the last reset. */
export interface MethodProfile {
  /** How many times the method was executed. */
  readonly count: number;
  /** Total time inside `execute`, in milliseconds, as a fractional value. */
  readonly totalMs: number;
}

/** Per-method totals, keyed by exported method name. */
export type ExecutionProfile = Readonly<Record<string, MethodProfile>>;

/**
 * Reads the accumulated per-method execution totals.
 * @returns Totals since the last {@link resetExecutionProfile}, keyed by method.
 * @category Core / Functions
 */
export function getExecutionProfile(): ExecutionProfile {
  return rnexecutorchJsi.getExecutionProfile() as ExecutionProfile;
}

/**
 * Clears the accumulated totals.
 *
 * Call immediately before the work being measured. The tally is global and
 * spans every loaded model, so a stale total from an earlier phase would be
 * counted against the current one.
 * @category Core / Functions
 */
export function resetExecutionProfile(): void {
  rnexecutorchJsi.resetExecutionProfile();
}

/**
 * Sums a profile to a single figure.
 * @param profile Totals as returned by {@link getExecutionProfile}.
 * @returns Milliseconds spent inside ExecuTorch across every method.
 * @category Core / Functions
 */
export function totalExecutionMs(profile: ExecutionProfile): number {
  return Object.values(profile).reduce((sum, entry) => sum + entry.totalMs, 0);
}
