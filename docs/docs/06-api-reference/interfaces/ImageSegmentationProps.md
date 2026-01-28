# Interface: ImageSegmentationProps

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:40](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/imageSegmentation.ts#L40)

Props for the `useImageSegmentation` hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:41](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/imageSegmentation.ts#L41)

An object containing the model source.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:42](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/imageSegmentation.ts#L42)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
