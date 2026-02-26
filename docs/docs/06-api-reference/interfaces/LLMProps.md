# Interface: LLMProps

Defined in: [types/llm.ts:8](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L8)

Properties for initializing and configuring a Large Language Model (LLM) instance.

## Properties

### model

> **model**: `object`

Defined in: [types/llm.ts:9](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L9)

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

Defined in: [types/llm.ts:26](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L26)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
