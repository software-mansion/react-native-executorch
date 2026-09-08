# Function: createLLMRunner()

> **createLLMRunner**(`modelPath`, `tokenizerPath`, `modalities?`): [`LLMRunner`](../type-aliases/LLMRunner.md)

Defined in: [extensions/llm/llmRunner.ts:164](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L164)

**`Experimental`**

Creates a native ExecuTorch LLM runner instance.
This API is experimental and might change in future releases. It
relies on experimental ExecuTorch runtime extensions and injected member-pointer
accessors to manage KV cache state that may evolve across releases.

## Parameters

### modelPath

`string`

Path to the local `.pte` model file.

### tokenizerPath

`string`

Path to the local tokenizer configuration file (e.g. `tokenizer.json`).

### modalities?

readonly (`"image"` \| `"audio"`)[]

List of supported input non-text modalities (e.g.
`['image']`). When omitted, defaults to text-only.

## Returns

[`LLMRunner`](../type-aliases/LLMRunner.md)

A native [LLMRunner](../type-aliases/LLMRunner.md) instance.
