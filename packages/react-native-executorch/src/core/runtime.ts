/**
 * Background worklet execution and thread runtime management.
 *
 * Provides utilities to dispatch synchronous, heavy native operations (model
 * compilation, tensor inference) onto dedicated background worklet threads,
 * preventing them from blocking the React Native JavaScript thread.
 * @module Core/Runtime
 */

import {
  createWorkletRuntime,
  runOnRuntimeAsync,
  type WorkletRuntime,
} from 'react-native-worklets';
import { isRnExecuTorchError, RnExecuTorchError } from './error';

/**
 * The default background worklet runtime used for all model execution.
 *
 * This runtime runs on a dedicated thread separate from the React Native JS
 * thread, preventing model loading and inference from blocking the UI. Pass it
 * explicitly (or a custom {@link WorkletRuntime}) to {@link wrapAsync} when you
 * need fine-grained control over which thread work executes on.
 * @category Core / Functions
 */
export const defaultWorkletRuntime = createWorkletRuntime({
  name: 'ExecuTorchDefaultRuntime',
});

/**
 * Wraps a synchronous worklet function so that it runs asynchronously on a
 * background {@link WorkletRuntime} thread and returns a `Promise`.
 *
 * The wrapper serializes arguments, dispatches the worklet to the target
 * runtime, awaits the result, and re-throws any error thrown inside the worklet
 * as an {@link RnExecuTorchError}. This keeps heavy native operations (model
 * loading, tensor computation) off the React Native JS thread.
 * @category Core / Functions
 * @typeParam Args The tuple of argument types of `fn`.
 * @typeParam R The return type of `fn`.
 * @param fn A synchronous worklet function to execute on the background
 * runtime.
 * @param runtime The worklet runtime to dispatch `fn` to. Defaults to
 * {@link defaultWorkletRuntime}.
 * @returns An async function with the same signature as `fn` that resolves to
 * `fn`'s return value or rejects with an {@link RnExecuTorchError} if `fn` throws.
 * @throws {RnExecuTorchError} Propagates any error thrown inside `fn` across the
 * worklet thread boundary.
 * @example
 * ```typescript
 * const asyncLoadModel = wrapAsync(loadModel);
 * const model = await asyncLoadModel('/path/to/model.pte');
 * ```
 */
export function wrapAsync<Args extends any[], R>(
  fn: (...args: Args) => R,
  runtime: WorkletRuntime = defaultWorkletRuntime
) {
  return async (...args: Args): Promise<R> => {
    const result = await runOnRuntimeAsync(
      runtime,
      (argsArray) => {
        'worklet';
        try {
          return { ok: true, value: fn(...argsArray) };
        } catch (e: any) {
          // Only plain data survives the hop back to the React Native runtime:
          // class identity, the prototype chain, and the stack do not. Carry the
          // fields needed to rebuild the error on the other side.
          let error;
          if (isRnExecuTorchError(e)) {
            error = {
              name: 'RnExecuTorchError',
              code: e.code,
              message: e.message,
              etRuntimeErrorCode: e.etRuntimeErrorCode,
            };
          } else {
            error = e?.message ?? String(e);
          }
          return { ok: false, error };
        }
      },
      args
    );

    if (!result.ok) {
      if (isRnExecuTorchError(result.error)) {
        throw RnExecuTorchError(
          result.error.code,
          result.error.message,
          result.error.etRuntimeErrorCode
        );
      }
      throw new Error(result.error);
    }
    return result.value!;
  };
}
