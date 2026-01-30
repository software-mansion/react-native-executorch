# Interface: ExecutorchModuleProps

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:11](https://github.com/software-mansion/react-native-executorch/blob/7e10c820da55c41850b183cae64d67ab1e216a67/packages/react-native-executorch/src/types/executorchModule.ts#L11)

Props for the `useExecutorchModule` hook.

## Properties

### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:12](https://github.com/software-mansion/react-native-executorch/blob/7e10c820da55c41850b183cae64d67ab1e216a67/packages/react-native-executorch/src/types/executorchModule.ts#L12)

The source of the ExecuTorch model binary.

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:13](https://github.com/software-mansion/react-native-executorch/blob/7e10c820da55c41850b183cae64d67ab1e216a67/packages/react-native-executorch/src/types/executorchModule.ts#L13)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
