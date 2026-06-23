# Interface: TextEmbeddingsModel

Defined in: [types/textEmbeddings.ts:60](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L60)

A text embeddings model config. Two optional flags drive `forward`:
`prompts` makes a `role` argument required, and `multiVector` makes it return
a per-token `EmbeddingResult` instead of a pooled `Float32Array`.

## Properties

### modelName

> **modelName**: [`TextEmbeddingsModelName`](../type-aliases/TextEmbeddingsModelName.md)

Defined in: [types/textEmbeddings.ts:61](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L61)

***

### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/textEmbeddings.ts:62](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L62)

***

### multiVector?

> `optional` **multiVector**: `boolean`

Defined in: [types/textEmbeddings.ts:65](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L65)

***

### prompts?

> `optional` **prompts**: [`EmbeddingPrompts`](EmbeddingPrompts.md)

Defined in: [types/textEmbeddings.ts:64](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L64)

***

### skipListIds?

> `optional` **skipListIds**: `number`[]

Defined in: [types/textEmbeddings.ts:72](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L72)

Document token ids to exclude from late-interaction scoring (e.g. ColBERT's
punctuation skipList). Derived from the model's training config, so it's
shipped here rather than reconstructed by the consumer, who passes it to
their own MaxSim scoring.

***

### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

Defined in: [types/textEmbeddings.ts:63](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L63)
