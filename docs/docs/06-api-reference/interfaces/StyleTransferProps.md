# Interface: StyleTransferProps

Defined in: [packages/react-native-executorch/src/types/styleTransfer.ts:12](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/styleTransfer.ts#L12)

Configuration properties for the `useStyleTransfer` hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/styleTransfer.ts:13](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/styleTransfer.ts#L13)

Object containing the `modelSource` for the style transfer model.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/styleTransfer.ts:14](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/styleTransfer.ts#L14)

Boolean that can prevent automatic model loading (and downloading the data if loaded for the first time) after running the hook.
