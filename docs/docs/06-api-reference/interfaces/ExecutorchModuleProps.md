# Interface: ExecutorchModuleProps

Defined in: packages/react-native-executorch/src/types/executorchModule.ts:10

Props for the `useExecutorchModule` hook.

## Properties

### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: packages/react-native-executorch/src/types/executorchModule.ts:11

The source of the ExecuTorch model binary.

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: packages/react-native-executorch/src/types/executorchModule.ts:12

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
