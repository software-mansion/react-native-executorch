# Interface: StyleTransferProps

Defined in: [types/styleTransfer.ts:24](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/styleTransfer.ts#L24)

Configuration properties for the `useStyleTransfer` hook.

## Properties

### model

> **model**: `object`

Defined in: [types/styleTransfer.ts:25](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/styleTransfer.ts#L25)

Object containing the model configuration.

#### modelName

> **modelName**: [`StyleTransferModelName`](../type-aliases/StyleTransferModelName.md)

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/styleTransfer.ts:26](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/styleTransfer.ts#L26)

Boolean that can prevent automatic model loading (and downloading the data if loaded for the first time) after running the hook.
