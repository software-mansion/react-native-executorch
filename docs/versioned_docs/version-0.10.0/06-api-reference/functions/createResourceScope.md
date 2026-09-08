# Function: createResourceScope()

> **createResourceScope**(): [`ResourceScope`](../type-aliases/ResourceScope.md)

Defined in: [core/lifetime.ts:68](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/lifetime.ts#L68)

Creates a [ResourceScope](../type-aliases/ResourceScope.md) for semi-automatic lifetime management of
native resources.

Wrap the allocating body in `try`/`catch`, `track` each resource as it is
created, and return `scope.dispose` as the resulting object's `dispose`. A
failure part-way through then releases everything allocated so far, and a
successful build hands the caller the same teardown path.

## Returns

[`ResourceScope`](../type-aliases/ResourceScope.md)

A scope that tracks resources and releases them on `dispose`.

## Example

```typescript
const scope = createResourceScope();
const dispose = scope.dispose;
try {
  const model = scope.track(await wrapAsync(loadModel, runtime)(modelPath));
  const { dims } = validateSpec(model.schema, { ... }); // may throw
  const tensors = [scope.track(tensor('float32', shape))];
  return { run, dispose };
} catch (error) {
  dispose();
  throw error;
}
```
