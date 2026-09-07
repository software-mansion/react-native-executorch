# Interface: LLMProps

Defined in: [types/llm.ts:69](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L69)

Properties for initializing and configuring a Large Language Model (LLM) instance.

## Properties

### model

> **model**: `object`

Defined in: [types/llm.ts:70](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L70)

#### capabilities?

> `optional` **capabilities**: readonly `"vision"`[]

Optional list of modality capabilities the model supports.
Determines the type of the `media` argument in `sendMessage`.
Example: `['vision']` enables `sendMessage(text, { imagePath })`.

#### generationConfig?

> `optional` **generationConfig**: [`GenerationConfig`](GenerationConfig.md)

Recommended default generation settings, typically copied from the
upstream `generation_config.json` or the model card. Applied automatically
after the native module loads and before any user `configure()` call,
so callers only need to override the values they want to change.

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

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/llm.ts:105](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/llm.ts#L105)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
