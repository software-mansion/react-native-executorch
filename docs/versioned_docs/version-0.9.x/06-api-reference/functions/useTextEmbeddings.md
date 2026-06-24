# Function: useTextEmbeddings()

> **useTextEmbeddings**\<`M`\>(`TextEmbeddingsProps`): [`TextEmbeddingsType`](../interfaces/TextEmbeddingsType.md)\<`M`\>

Defined in: [hooks/natural\_language\_processing/useTextEmbeddings.ts:20](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/hooks/natural_language_processing/useTextEmbeddings.ts#L20)

React hook for managing a Text Embeddings model instance.

## Type Parameters

### M

`M` *extends* [`TextEmbeddingsModel`](../interfaces/TextEmbeddingsModel.md)

## Parameters

### TextEmbeddingsProps

[`TextEmbeddingsProps`](../interfaces/TextEmbeddingsProps.md)\<`M`\>

Configuration object containing `model` source and optional `preventLoad` flag.

## Returns

[`TextEmbeddingsType`](../interfaces/TextEmbeddingsType.md)\<`M`\>

Ready to use Text Embeddings model. `forward` returns a
  `Float32Array` for pooled models and an `EmbeddingResult` (per-token
  vectors) for multi-vector models. Models with prompts require a `role`
  ('query' | 'document') on `forward`.
