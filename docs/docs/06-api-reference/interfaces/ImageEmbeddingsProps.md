# Interface: ImageEmbeddingsProps

Defined in: [packages/react-native-executorch/src/types/imageEmbeddings.ts:12](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/imageEmbeddings.ts#L12)

Props for the `useImageEmbeddings` hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/imageEmbeddings.ts:13](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/imageEmbeddings.ts#L13)

An object containing the model source.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/imageEmbeddings.ts:14](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/imageEmbeddings.ts#L14)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
