# Interface: ExecutorchModuleProps

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:11](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/types/executorchModule.ts#L11)

Props for the `useExecutorchModule` hook.

## Properties

### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:12](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/types/executorchModule.ts#L12)

The source of the ExecuTorch model binary.

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/executorchModule.ts:13](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/types/executorchModule.ts#L13)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
