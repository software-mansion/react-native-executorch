# Interface: LLMProps

Defined in: [types/llm.ts:62](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L62)

Properties for initializing and configuring a Large Language Model (LLM) instance.

## Properties

### model

> **model**: `object`

Defined in: [types/llm.ts:63](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L63)

#### capabilities?

> `optional` **capabilities**: readonly `"vision"`[]

Optional list of modality capabilities the model supports.
Determines the type of the `media` argument in `sendMessage`.
Example: `['vision']` enables `sendMessage(text, { imagePath })`.

#### modelName

> **modelName**: [`LLMModelName`](../type-aliases/LLMModelName.md)

The built-in model name (e.g. `'llama-3.2-3b'`). Used for telemetry and hook reload triggers.
Pass one of the pre-built LLM constants (e.g. `LLAMA3_2_3B`) to populate all required fields.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` that specifies the location of the model binary.

#### tokenizerConfigSource

> **tokenizerConfigSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` pointing to the JSON file which contains the tokenizer config.

#### tokenizerSource

> **tokenizerSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` pointing to the JSON file which contains the tokenizer.

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/llm.ts:91](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L91)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
