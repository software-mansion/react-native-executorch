# Interface: LLMProps

Defined in: [packages/react-native-executorch/src/types/llm.ts:9](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/types/llm.ts#L9)

Properties for initializing and configuring a Large Language Model (LLM) instance.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/llm.ts:10](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/types/llm.ts#L10)

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` that specifies the location of the model binary.

#### tokenizerConfigSource?

> `optional` **tokenizerConfigSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` pointing to the JSON file which contains the tokenizer config.

#### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` pointing to the JSON file which contains the tokenizer.

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/llm.ts:27](https://github.com/software-mansion/react-native-executorch/blob/85b94bbe439dcc3a7da16d608f443313132ff5d8/packages/react-native-executorch/src/types/llm.ts#L27)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
