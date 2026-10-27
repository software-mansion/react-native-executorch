# Type Alias: VectorStoreOptions

> **VectorStoreOptions** = `object`

Defined in: [extensions/vectorStore.ts:22](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L22)

Options for [createVectorStore](../functions/createVectorStore.md).

## Properties

### dimension?

> `readonly` `optional` **dimension**: `number`

Defined in: [extensions/vectorStore.ts:27](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L27)

The length every vector must have. When omitted, the first vector added
fixes it.

---

### metric?

> `readonly` `optional` **metric**: [`VectorStoreMetric`](VectorStoreMetric.md)

Defined in: [extensions/vectorStore.ts:29](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L29)

The similarity metric used by [VectorStore.query](VectorStore.md#query). Defaults to `'cosine'`.
