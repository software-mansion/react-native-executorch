# Interface: ImageSegmentationProps

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:44](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/imageSegmentation.ts#L44)

Props for the `useImageSegmentation` hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:45](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/imageSegmentation.ts#L45)

An object containing the model source.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:46](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/imageSegmentation.ts#L46)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
