# Interface: Props

Defined in: packages/react-native-executorch/src/types/textEmbeddings.ts:39

Props for the useTextEmbeddings hook.

## Properties

### model

> **model**: `object`

Defined in: packages/react-native-executorch/src/types/textEmbeddings.ts:40

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` that specifies the location of the model binary.

#### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` pointing to the JSON file which contains the tokenizer.

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: packages/react-native-executorch/src/types/textEmbeddings.ts:55

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
