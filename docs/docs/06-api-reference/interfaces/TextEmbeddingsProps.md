# Interface: TextEmbeddingsProps

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:39](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/textEmbeddings.ts#L39)

Props for the useTextEmbeddings hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:40](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/textEmbeddings.ts#L40)

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` that specifies the location of the model binary.

#### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` pointing to the JSON file which contains the tokenizer.

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:55](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/types/textEmbeddings.ts#L55)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
