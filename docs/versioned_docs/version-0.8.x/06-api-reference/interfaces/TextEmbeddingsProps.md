# Interface: TextEmbeddingsProps

Defined in: [types/textEmbeddings.ts:24](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/textEmbeddings.ts#L24)

Props for the useTextEmbeddings hook.

## Properties

### model

> **model**: `object`

Defined in: [types/textEmbeddings.ts:25](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/textEmbeddings.ts#L25)

An object containing the model configuration.

#### modelName

> **modelName**: [`TextEmbeddingsModelName`](../type-aliases/TextEmbeddingsModelName.md)

The unique name of the text embeddings model.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

The source of the text embeddings model binary.

#### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

The source of the tokenizer JSON file.

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/textEmbeddings.ts:39](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/textEmbeddings.ts#L39)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
