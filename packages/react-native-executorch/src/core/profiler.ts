/**
 * Time spent inside ExecuTorch, accumulated across `execute` calls.
 *
 * Every `execute` call adds its duration to a process-global tally, keyed by
 * model path and method name. Reset it before a piece of work and read it after
 * to see how much of that work was model execution, as opposed to the
 * preprocessing and postprocessing around it. This works for pipelines too,
 * since the tally does not need a handle to the models a pipeline loads.
 * @example
 * ```typescript
 * import { profiler } from 'react-native-executorch';
 *
 * profiler.reset();
 * await embedder.embed('Hello world');
 * const stats = profiler.get(); // { '/path/to/model.pte': { forward: { count: 1, totalMs: 4.2 } } }
 * ```
 */

import { rnexecutorchJsi } from '../native/bridge';

/**
 * Accumulated `execute` totals of one exported method.
 * @category Core / Profiler / Types
 */
export type MethodProfile = {
  /** Number of `execute` calls. */
  readonly count: number;
  /** Total time spent in those calls, in milliseconds (fractional). */
  readonly totalMs: number;
};

/**
 * Accumulated totals of one model, keyed by exported method name.
 * @category Core / Profiler / Types
 */
export type ModelProfile = Readonly<Record<string, MethodProfile>>;

/**
 * Reads the totals accumulated since the last {@link reset}.
 * @returns Totals of every executed model, keyed by model path.
 * @category Core / Profiler / Functions
 */
export function get(): Readonly<Record<string, ModelProfile>>;
/**
 * Reads the totals one model accumulated since the last {@link reset}.
 * @param modelPath The model's path, as in `model.path`.
 * @returns Totals keyed by method name; empty if the model was not executed.
 * @category Core / Profiler / Functions
 */
export function get(modelPath: string): ModelProfile;
export function get(modelPath?: string) {
  'worklet';
  return modelPath === undefined
    ? rnexecutorchJsi.profiler.get()
    : rnexecutorchJsi.profiler.get(modelPath);
}

/**
 * Clears the accumulated totals of every model.
 * @category Core / Profiler / Functions
 */
export function reset(): void {
  'worklet';
  rnexecutorchJsi.profiler.reset();
}
