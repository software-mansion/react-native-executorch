# Interface: StyleTransferProps

Defined in: [types/styleTransfer.ts:26](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/styleTransfer.ts#L26)

Configuration properties for the `useStyleTransfer` hook.

## Properties

### model

> **model**: `object`

Defined in: [types/styleTransfer.ts:27](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/styleTransfer.ts#L27)

Object containing the model configuration.

#### modelName

> **modelName**: [`StyleTransferModelName`](../type-aliases/StyleTransferModelName.md)

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/styleTransfer.ts:28](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/styleTransfer.ts#L28)

Boolean that can prevent automatic model loading (and downloading the data if loaded for the first time) after running the hook.
