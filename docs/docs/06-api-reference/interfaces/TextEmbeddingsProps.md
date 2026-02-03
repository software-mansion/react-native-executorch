# Interface: TextEmbeddingsProps

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:11](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/textEmbeddings.ts#L11)

Props for the useTextEmbeddings hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:12](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/textEmbeddings.ts#L12)

An object containing the model and tokenizer sources.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

The source of the text embeddings model binary.

#### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

The source of the tokenizer JSON file.

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:22](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/textEmbeddings.ts#L22)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
