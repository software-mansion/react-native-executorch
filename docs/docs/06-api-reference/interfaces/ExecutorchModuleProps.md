# Interface: ExecutorchModuleProps

Defined in: [types/executorchModule.ts:10](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/executorchModule.ts#L10)

Props for the `useExecutorchModule` hook.

## Properties

### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/executorchModule.ts:11](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/executorchModule.ts#L11)

The source of the ExecuTorch model binary.

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/executorchModule.ts:12](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/executorchModule.ts#L12)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
