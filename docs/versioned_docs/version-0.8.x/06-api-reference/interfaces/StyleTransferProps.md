# Interface: StyleTransferProps

Defined in: [types/styleTransfer.ts:26](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/styleTransfer.ts#L26)

Configuration properties for the `useStyleTransfer` hook.

## Properties

### model

> **model**: `object`

Defined in: [types/styleTransfer.ts:27](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/styleTransfer.ts#L27)

Object containing the model configuration.

#### modelName

> **modelName**: [`StyleTransferModelName`](../type-aliases/StyleTransferModelName.md)

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/styleTransfer.ts:28](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/styleTransfer.ts#L28)

Boolean that can prevent automatic model loading (and downloading the data if loaded for the first time) after running the hook.
