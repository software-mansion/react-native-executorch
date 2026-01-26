# Interface: StyleTransferProps

Defined in: packages/react-native-executorch/src/types/styleTransfer.ts:11

Configuration properties for the `useStyleTransfer` hook.

## Properties

### model

> **model**: `object`

Defined in: packages/react-native-executorch/src/types/styleTransfer.ts:12

Object containing the `modelSource` for the style transfer model.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: packages/react-native-executorch/src/types/styleTransfer.ts:13

Boolean that can prevent automatic model loading (and downloading the data if loaded for the first time) after running the hook.
