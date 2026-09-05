/**
 * Automatic disposal for pipelines a test creates.
 *
 * Without it, an assertion that fails before the test reaches its `dispose()`
 * call trips the global leak check too, and the real failure ends up buried
 * under a second, misleading error. Wrapping construction in `tracked()` keeps
 * the reported failure to the one that matters.
 *
 * Disposal is idempotent, so tests that assert on `dispose()` explicitly can
 * still call it themselves.
 */
type NativeResource = { dispose: () => void };

const created: NativeResource[] = [];

/**
 * Registers `instance` for disposal at the end of the current test.
 * @typeParam T The pipeline type.
 * @param instance The pipeline to track.
 * @returns The same instance.
 */
export function tracked<T extends NativeResource>(instance: T): T {
  created.push(instance);
  return instance;
}

/** Disposes everything tracked in the current test. Called from the setup file. */
export function disposeTracked(): void {
  for (const instance of created.splice(0)) {
    try {
      instance.dispose();
    } catch {
      // A pipeline that fails to dispose is reported by the leak check instead.
    }
  }
}
