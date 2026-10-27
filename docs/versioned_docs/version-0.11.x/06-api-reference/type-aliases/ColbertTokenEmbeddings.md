# Type Alias: ColbertTokenEmbeddings

> **ColbertTokenEmbeddings** = `object`

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:87](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L87)

A multi-vector embedding: one vector per token.

## Properties

### data

> `readonly` **data**: `Float32Array`

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:89](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L89)

Row-major `[numTokens, dimension]` matrix of L2-normalized token vectors.

---

### dimension

> `readonly` **dimension**: `number`

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:93](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L93)

The length of each token vector (columns).

---

### numTokens

> `readonly` **numTokens**: `number`

Defined in: [extensions/nlp/tasks/colbertEmbedding.ts:91](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/tasks/colbertEmbedding.ts#L91)

The number of token vectors (rows).
