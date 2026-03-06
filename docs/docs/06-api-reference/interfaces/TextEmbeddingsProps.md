# Interface: TextEmbeddingsProps

Defined in: [types/textEmbeddings.ts:26](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/textEmbeddings.ts#L26)

Props for the useTextEmbeddings hook.

## Properties

### model

> **model**: `object`

Defined in: [types/textEmbeddings.ts:27](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/textEmbeddings.ts#L27)

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

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/textEmbeddings.ts:41](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/textEmbeddings.ts#L41)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
