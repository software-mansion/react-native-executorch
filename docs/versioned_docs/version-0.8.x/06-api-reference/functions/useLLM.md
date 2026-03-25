# Function: useLLM()

## Call Signature

> **useLLM**\<`C`\>(`props`): [`LLMTypeMultimodal`](../interfaces/LLMTypeMultimodal.md)\<`C`\>

Defined in: [hooks/natural\_language\_processing/useLLM.ts:20](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/hooks/natural_language_processing/useLLM.ts#L20)

React hook for managing a Large Language Model (LLM) instance.

### Type Parameters

#### C

`C` *extends* readonly `"vision"`[]

### Parameters

#### props

[`LLMProps`](../interfaces/LLMProps.md) & `object`

Object containing model, tokenizer, and tokenizer config sources.

### Returns

[`LLMTypeMultimodal`](../interfaces/LLMTypeMultimodal.md)\<`C`\>

An object implementing the `LLMTypeMultimodal` interface when `model.capabilities` is provided, otherwise `LLMType`.

## Call Signature

> **useLLM**(`props`): [`LLMType`](../interfaces/LLMType.md)

Defined in: [hooks/natural\_language\_processing/useLLM.ts:23](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/hooks/natural_language_processing/useLLM.ts#L23)

React hook for managing a Large Language Model (LLM) instance.

### Parameters

#### props

[`LLMProps`](../interfaces/LLMProps.md)

Object containing model, tokenizer, and tokenizer config sources.

### Returns

[`LLMType`](../interfaces/LLMType.md)

An object implementing the `LLMTypeMultimodal` interface when `model.capabilities` is provided, otherwise `LLMType`.
