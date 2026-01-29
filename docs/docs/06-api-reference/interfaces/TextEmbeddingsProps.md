# Interface: TextEmbeddingsProps

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:46](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/types/textEmbeddings.ts#L46)

Props for the useTextEmbeddings hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:47](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/types/textEmbeddings.ts#L47)

An object containing the model and tokenizer sources.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

The source of the text embeddings model binary.

#### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

The source of the tokenizer JSON file.

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:57](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/types/textEmbeddings.ts#L57)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
