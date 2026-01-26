# Interface: TextEmbeddingsProps

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:40](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/textEmbeddings.ts#L40)

Props for the useTextEmbeddings hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:41](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/textEmbeddings.ts#L41)

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` that specifies the location of the model binary.

#### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` pointing to the JSON file which contains the tokenizer.

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:56](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/types/textEmbeddings.ts#L56)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
