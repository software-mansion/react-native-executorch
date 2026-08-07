import {
  createWorkletRuntime,
  runOnRuntimeAsync,
  type WorkletRuntime,
} from 'react-native-worklets';
import { RnExecutorchErrorCode, toRnExecutorchError, type RnExecutorchErrorLike } from '../errors';

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
 * as an {@link RnExecutorchError}. This keeps heavy native operations (model
 * loading, tensor computation) off the React Native JS thread.
 * @category Utils
 * @typeParam Args The tuple of argument types of `fn`.
 * @typeParam R The return type of `fn`.
 * @param fn A synchronous worklet function to execute on the background
 * runtime.
 * @param runtime The worklet runtime to dispatch `fn` to. Defaults to
 * {@link defaultWorkletRuntime}.
 * @returns An async function with the same signature as `fn` that resolves to
 * `fn`'s return value or rejects with an `RnExecutorchError` if `fn` throws.
 */
export function wrapAsync<Args extends any[], R>(
  fn: (...args: Args) => R,
  runtime: WorkletRuntime = defaultWorkletRuntime
) {
  // A worklet closure may only capture serializable values, so the fallback
  // code is pulled out as a plain number rather than reaching for the enum
  // object from inside the worklet.
  const internal = RnExecutorchErrorCode.Internal;

  return async (...args: Args): Promise<R> => {
    const result = await runOnRuntimeAsync(
      runtime,
      (argsArray): { ok: true; value: R } | { ok: false; error: RnExecutorchErrorLike } => {
        'worklet';
        try {
          return { ok: true, value: fn(...argsArray) };
        } catch (e: any) {
          // Class identity, the prototype chain, and the stack do not survive
          // the hop back to the React Native runtime — only plain data does.
          // Carry the fields `toRnExecutorchError` needs to rebuild a real
          // error on the other side.
          return {
            ok: false,
            error: {
              code: typeof e?.code === 'number' ? e.code : internal,
              message: typeof e?.message === 'string' ? e.message : String(e),
              etCode: typeof e?.etCode === 'number' ? e.etCode : undefined,
            },
          };
        }
      },
      args
    );

    if (!result.ok) throw toRnExecutorchError(result.error);
    return result.value;
  };
}
