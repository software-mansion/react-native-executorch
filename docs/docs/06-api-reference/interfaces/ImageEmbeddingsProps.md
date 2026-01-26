# Interface: ImageEmbeddingsProps

Defined in: packages/react-native-executorch/src/types/imageEmbeddings.ts:11

Props for the `useImageEmbeddings` hook.

## Properties

### model

> **model**: `object`

Defined in: packages/react-native-executorch/src/types/imageEmbeddings.ts:12

An object containing the model source.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: packages/react-native-executorch/src/types/imageEmbeddings.ts:13

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
