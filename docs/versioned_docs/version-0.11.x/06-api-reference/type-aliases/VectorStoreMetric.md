# Type Alias: VectorStoreMetric

> **VectorStoreMetric** = `"cosine"` \| `"dot"`

Defined in: [extensions/vectorStore.ts:16](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/vectorStore.ts#L16)

How a [VectorStore](VectorStore.md) scores a stored vector against a query.

- `'cosine'`: cosine similarity, in `[-1, 1]`. Neither side has to be
  normalized. A zero vector scores 0 against everything.
- `'dot'`: the raw dot product. Equal to cosine for L2-normalized vectors
  (which every embedder in the `models` registry emits) and slightly cheaper.
