/**
 * Construction-time ownership of native resources.
 *
 * A factory that builds a pipeline allocates as it goes: it loads models,
 * validates their schemas, pre-allocates execution tensors, and only at the end
 * hands the caller a `dispose`. Anything that throws in between leaves the
 * caller with no reference to what was already allocated, and native memory is
 * not garbage collected, so it stays alive for the rest of the process.
 *
 * A scope closes that window: every resource is tracked as it is created, and
 * one `dispose` releases whatever exists at the moment it is called. The same
 * function is the pipeline's own `dispose`, so there is a single teardown path
 * rather than one for failure and one for success.
 */

/**
 * Anything holding native memory that has to be released explicitly.
 * @category Core / Types
 */
export type NativeResource = { dispose: () => void };

/**
 * A set of native resources with a single teardown.
 * @category Core / Types
 */
export type ResourceScope = {
  /**
   * Takes ownership of a resource and returns it unchanged, so it can wrap an
   * allocation in place.
   */
  readonly track: <R extends NativeResource>(resource: R) => R;

  /**
   * Releases every tracked resource, most recently allocated first. Safe to
   * call more than once: a second call has nothing left to release.
   */
  readonly dispose: () => void;
};

/**
 * Creates a {@link ResourceScope} for semi-automatic lifetime management of
 * native resources.
 *
 * Wrap the allocating body in `try`/`catch`, `track` each resource as it is
 * created, and return `scope.dispose` as the resulting object's `dispose`. A
 * failure part-way through then releases everything allocated so far, and a
 * successful build hands the caller the same teardown path.
 * @category Core / Functions
 * @returns A scope that tracks resources and releases them on `dispose`.
 * @example
 * ```typescript
 * const scope = createResourceScope();
 * const dispose = scope.dispose;
 * try {
 *   const model = scope.track(await wrapAsync(loadModel, runtime)(modelPath));
 *   const { dims } = validateSpec(model.schema, { ... }); // may throw
 *   const tensors = [scope.track(tensor('float32', shape))];
 *   return { run, dispose };
 * } catch (error) {
 *   dispose();
 *   throw error;
 * }
 * ```
 */
export function createResourceScope(): ResourceScope {
  const allocated: NativeResource[] = [];

  return {
    track: <R extends NativeResource>(resource: R): R => {
      allocated.push(resource);
      return resource;
    },
    // Reverse order, so a resource is released before whatever it was built
    // from. `splice` empties the list as it goes, which is what makes a second
    // call a no-op rather than a double dispose.
    dispose: (): void => {
      for (const resource of allocated.splice(0).reverse()) resource.dispose();
    },
  };
}
