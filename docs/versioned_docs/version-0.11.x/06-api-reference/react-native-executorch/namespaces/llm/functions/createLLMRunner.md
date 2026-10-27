# Function: createLLMRunner()

> **createLLMRunner**(`modelPath`, `tokenizerPath`, `modalities?`, `runtime?`): `Promise`\<[`LLMRunner`](../type-aliases/LLMRunner.md)\>

Defined in: [extensions/llm/llmRunner.ts:177](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L177)

Creates an ExecuTorch LLM runner instance.

Loads the model and its tokenizer, validates the model's exported methods
against the supported runner specs, and returns the matching runner.

## Parameters

### modelPath

`string`

Path to the local `.pte` model file.

### tokenizerPath

`string`

Path to the local tokenizer file (e.g. `tokenizer.json`).

### modalities?

readonly (`"image"` \| `"audio"`)[]

List of supported input non-text modalities (e.g.
`['image']`). When omitted, defaults to text-only.

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to load the model and
tokenizer.

## Returns

`Promise`\<[`LLMRunner`](../type-aliases/LLMRunner.md)\>

A promise resolving to the [LLMRunner](../type-aliases/LLMRunner.md) instance.
