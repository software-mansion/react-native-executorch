import {
  createWorkletRuntime,
  runOnRuntimeAsync,
  type WorkletRuntime,
} from 'react-native-worklets';

export const defaultWorkletRuntime = createWorkletRuntime({
  name: 'ExecuTorchDefaultRuntime',
});

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
