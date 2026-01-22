# Interface: Props

Defined in: [packages/react-native-executorch/src/hooks/natural_language_processing/useTextEmbeddings.ts:8](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/hooks/natural_language_processing/useTextEmbeddings.ts#L8)

Props for the useTextEmbeddings hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/hooks/natural_language_processing/useTextEmbeddings.ts:9](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/hooks/natural_language_processing/useTextEmbeddings.ts#L9)

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` that specifies the location of the model binary.

#### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` pointing to the JSON file which contains the tokenizer.

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/hooks/natural_language_processing/useTextEmbeddings.ts:24](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/hooks/natural_language_processing/useTextEmbeddings.ts#L24)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
