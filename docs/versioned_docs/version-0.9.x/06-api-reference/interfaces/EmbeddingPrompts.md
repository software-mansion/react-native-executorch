# Interface: EmbeddingPrompts

Defined in: [types/textEmbeddings.ts:49](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L49)

Asymmetric prompts a model is trained with. When a model config carries
these, `forward` requires a `role` so the matching prompt is always applied.

## Properties

### document

> **document**: `string`

Defined in: [types/textEmbeddings.ts:51](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L51)

***

### query

> **query**: `string`

Defined in: [types/textEmbeddings.ts:50](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L50)
