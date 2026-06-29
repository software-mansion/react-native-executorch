# Interface: EmbeddingResult

Defined in: [types/textEmbeddings.ts:25](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L25)

Per-token (multi-vector) embedding output for late-interaction models (e.g.
ColBERT). Only `multiVector` models yield this; standard models return a
pooled `Float32Array` from `forward` instead.

## Properties

### embeddingDim

> **embeddingDim**: `number`

Defined in: [types/textEmbeddings.ts:31](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L31)

Per-token vector dimension.

***

### numTokens

> **numTokens**: `number`

Defined in: [types/textEmbeddings.ts:29](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L29)

Number of token rows.

***

### tokenIds

> **tokenIds**: `number`[]

Defined in: [types/textEmbeddings.ts:33](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L33)

Input token ids per row.

***

### vectors

> **vectors**: `Float32Array`

Defined in: [types/textEmbeddings.ts:27](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L27)

Flat [numTokens * embeddingDim] fp32 vectors (row-major).
