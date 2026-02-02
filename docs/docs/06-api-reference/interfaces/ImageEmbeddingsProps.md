# Interface: ImageEmbeddingsProps

Defined in: [packages/react-native-executorch/src/types/imageEmbeddings.ts:12](https://github.com/software-mansion/react-native-executorch/blob/d2a421e89661061da4ea192880e5bbf8f1b7a7be/packages/react-native-executorch/src/types/imageEmbeddings.ts#L12)

Props for the `useImageEmbeddings` hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/imageEmbeddings.ts:13](https://github.com/software-mansion/react-native-executorch/blob/d2a421e89661061da4ea192880e5bbf8f1b7a7be/packages/react-native-executorch/src/types/imageEmbeddings.ts#L13)

An object containing the model source.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/imageEmbeddings.ts:14](https://github.com/software-mansion/react-native-executorch/blob/d2a421e89661061da4ea192880e5bbf8f1b7a7be/packages/react-native-executorch/src/types/imageEmbeddings.ts#L14)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
