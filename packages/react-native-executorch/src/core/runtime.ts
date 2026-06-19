import {
  createWorkletRuntime,
  runOnRuntimeAsync,
  type WorkletRuntime,
} from 'react-native-worklets';

/**
 * The default background worklet runtime used for all model execution.
 *
 * This runtime runs on a dedicated thread separate from the React Native JS
 * thread, preventing model loading and inference from blocking the UI. Pass it
 * explicitly (or a custom {@link WorkletRuntime}) to {@link wrapAsync} when you
 * need fine-grained control over which thread work executes on.
 * @category Utils
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
 * as a standard JS `Error`. This keeps heavy native operations (model loading,
 * tensor computation) off the React Native JS thread.
 * @category Utils
 * @typeParam Args The tuple of argument types of `fn`.
 * @typeParam R The return type of `fn`.
 * @param fn A synchronous worklet function to execute on the background
 * runtime.
 * @param runtime The worklet runtime to dispatch `fn` to. Defaults to
 * {@link defaultWorkletRuntime}.
 * @returns An async function with the same signature as `fn` that resolves to
 * `fn`'s return value or rejects with an `Error` if `fn` throws.
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
          return { ok: false, error: e?.message ?? String(e) };
        }
      },
      args
    );

    if (!result.ok) throw new Error(result.error);
    return result.value!;
  };
}
