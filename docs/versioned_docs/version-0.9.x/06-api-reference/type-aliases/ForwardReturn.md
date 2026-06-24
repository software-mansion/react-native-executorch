# Type Alias: ForwardReturn\<M\>

> **ForwardReturn**\<`M`\> = `M` *extends* `object` ? [`EmbeddingResult`](../interfaces/EmbeddingResult.md) : `Float32Array`

Defined in: [types/textEmbeddings.ts:79](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L79)

`forward`'s return type: `EmbeddingResult` for `multiVector` models,
`Float32Array` otherwise.

## Type Parameters

### M

`M` *extends* [`TextEmbeddingsModel`](../interfaces/TextEmbeddingsModel.md)
