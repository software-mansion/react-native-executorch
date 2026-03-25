# Interface: ImageEmbeddingsProps

Defined in: [types/imageEmbeddings.ts:20](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/imageEmbeddings.ts#L20)

Props for the `useImageEmbeddings` hook.

## Properties

### model

> **model**: `object`

Defined in: [types/imageEmbeddings.ts:21](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/imageEmbeddings.ts#L21)

An object containing the model configuration.

#### modelName

> **modelName**: [`ImageEmbeddingsModelName`](../type-aliases/ImageEmbeddingsModelName.md)

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/imageEmbeddings.ts:22](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/imageEmbeddings.ts#L22)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
