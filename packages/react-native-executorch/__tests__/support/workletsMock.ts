/**
 * Mock of `react-native-worklets`.
 *
 * The real package needs a native worklet runtime, and `src/core/runtime.ts`
 * calls `createWorkletRuntime` at module scope — importing anything from `src/`
 * would crash without this. Since a worklet is an ordinary JS function that has
 * been marked for a second runtime, running it inline on the test's own thread
 * exercises exactly the same code; the only thing not covered is the thread
 * hop itself, which belongs to react-native-worklets rather than to this
 * library.
 */

/** Stand-in for the opaque native runtime handle. */
export type WorkletRuntime = { readonly name: string };

export const createWorkletRuntime = (config?: { name?: string }): WorkletRuntime => ({
  name: config?.name ?? 'FakeWorkletRuntime',
});

/**
 * Runs `fn` inline and resolves with its result. Kept async so callers still
 * observe a microtask boundary, the way the real dispatch does.
 * @param _runtime Ignored — there is only one thread here.
 * @param fn The worklet to run.
 * @param args Arguments forwarded to `fn`.
 * @returns A promise resolving to `fn`'s return value.
 */
export const runOnRuntimeAsync = async <Args, R>(
  _runtime: WorkletRuntime,
  fn: (args: Args) => R,
  args: Args
): Promise<R> => fn(args);

/**
 * Schedules `fn` back on the "RN thread" — inline here, but deferred to a
 * macrotask so a caller that expects it not to run synchronously still holds.
 * @param fn The callback to schedule.
 * @param args Arguments forwarded to `fn`.
 */
export const scheduleOnRN = <Args extends unknown[]>(
  fn: (...args: Args) => unknown,
  ...args: Args
): void => {
  setTimeout(() => fn(...args), 0);
};

/**
 * Minimal single-threaded stand-in for a `Synchronizable`. With one thread
 * there is nothing to synchronize, so this is a plain boxed value.
 * @typeParam T The boxed value type.
 * @param initial The initial value.
 * @returns The synchronizable box.
 */
export const createSynchronizable = <T>(initial: T) => {
  let value = initial;
  return {
    getDirty: () => value,
    getBlocking: () => value,
    setBlocking: (next: T | ((prev: T) => T)) => {
      value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
    },
    lock: () => {},
    unlock: () => {},
  };
};
