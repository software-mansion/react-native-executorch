# Interface: TextEmbeddingsProps\<M\>

Defined in: [types/textEmbeddings.ts:112](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L112)

Props for the useTextEmbeddings hook.

## Type Parameters

### M

`M` *extends* [`TextEmbeddingsModel`](TextEmbeddingsModel.md) = [`TextEmbeddingsModel`](TextEmbeddingsModel.md)

## Properties

### model

> **model**: `M`

Defined in: [types/textEmbeddings.ts:115](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L115)

An object containing the model configuration.

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/textEmbeddings.ts:116](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L116)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
