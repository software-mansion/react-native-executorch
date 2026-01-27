# Function: useLLM()

> **useLLM**(`model`): [`LLMType`](../interfaces/LLMType.md)

Defined in: [packages/react-native-executorch/src/hooks/natural\_language\_processing/useLLM.ts:18](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/hooks/natural_language_processing/useLLM.ts#L18)

React hook for managing a Large Language Model (LLM) instance.

## Parameters

### model

Object containing model, tokenizer, and tokenizer config sources.

#### model

\{ `modelSource`: [`ResourceSource`](../type-aliases/ResourceSource.md); `tokenizerConfigSource`: [`ResourceSource`](../type-aliases/ResourceSource.md); `tokenizerSource`: [`ResourceSource`](../type-aliases/ResourceSource.md); \}

#### model.modelSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` that specifies the location of the model binary.

#### model.tokenizerConfigSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource` pointing to the JSON file which contains the tokenizer config.

#### model.tokenizerSource

[`ResourceSource`](../type-aliases/ResourceSource.md)

`ResourceSource pointing` to the JSON file which contains the tokenizer.

#### preventLoad?

`boolean` = `false`

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

## Returns

[`LLMType`](../interfaces/LLMType.md)

An object implementing the `LLMType` interface for interacting with the LLM.
