# Type Alias: LoadModelOptions

> **LoadModelOptions** = `object`

Defined in: [core/model.ts:83](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/model.ts#L83)

Configuration options for loading an ExecuTorch model into native memory.

## Properties

### eagerLoadMethods?

> `readonly` `optional` **eagerLoadMethods**: `boolean`

Defined in: [core/model.ts:95](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/core/model.ts#L95)

Whether to eagerly load and compile all model methods and delegate subgraphs
during initialization.

When `true` (the default), all exported methods are fully loaded and backend
delegates (such as CoreML or Vulkan) are compiled into memory upfront,
guaranteeing instantaneous first-inference latency.

Set to `false` to lazily load and compile methods on their first execution.

#### Default

```ts
true;
```
