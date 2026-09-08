# Type Alias: LLMRunner

> **LLMRunner** = `object`

Defined in: [extensions/llm/llmRunner.ts:96](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L96)

**`Experimental`**

Handle to a native ExecuTorch LLM runner.
This API is experimental and might change in future releases. It
relies on experimental ExecuTorch runtime extensions and injected member-pointer
accessors to manage KV cache state that may evolve across releases.

## Properties

### modalities

> `readonly` **modalities**: readonly [`Modality`](Modality.md)[]

Defined in: [extensions/llm/llmRunner.ts:102](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L102)

List of supported non-text input modalities for this runner (e.g. `['image']`).

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/llm/llmRunner.ts:98](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L98)

Path to the local model file.

---

### tokenizerPath

> `readonly` **tokenizerPath**: `string`

Defined in: [extensions/llm/llmRunner.ts:100](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L100)

Path to the local tokenizer configuration file.

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [extensions/llm/llmRunner.ts:107](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L107)

Releases all allocated native resources.

#### Returns

`void`

---

### generate()

> **generate**(`prompt`, `config?`, `onToken?`): [`LLMGenerationStats`](LLMGenerationStats.md)

Defined in: [extensions/llm/llmRunner.ts:139](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L139)

Generates text continuation from a prompt.

#### Parameters

##### prompt

[`Prompt`](Prompt.md)

The text or multimodal prompt to generate continuation for.

##### config?

[`LLMGenerationConfig`](LLMGenerationConfig.md)

Generation configuration options.

##### onToken?

(`token`) => `void`

Callback function triggered whenever a new token is generated.

#### Returns

[`LLMGenerationStats`](LLMGenerationStats.md)

Generation performance statistics.

---

### getKVCacheState()

> **getKVCacheState**(): [`LLMKVCacheState`](LLMKVCacheState.md)

Defined in: [extensions/llm/llmRunner.ts:124](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L124)

Returns current KV cache occupancy and total context capacity metrics.

#### Returns

[`LLMKVCacheState`](LLMKVCacheState.md)

---

### prefill()

> **prefill**(`prompt`): `void`

Defined in: [extensions/llm/llmRunner.ts:130](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L130)

Prefills the runner with a prompt to build up the KV cache.

#### Parameters

##### prompt

[`Prompt`](Prompt.md)

The prefill text or multimodal prompt.

#### Returns

`void`

---

### reset()

> **reset**(`targetPos?`): `void`

Defined in: [extensions/llm/llmRunner.ts:119](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L119)

Resets the runner KV cache. If `targetPos` is provided, sets the KV cache
start position to `targetPos`. Otherwise resets to 0.

#### Parameters

##### targetPos?

`number`

Optional token position index to reset to.

#### Returns

`void`

---

### stop()

> **stop**(): `void`

Defined in: [extensions/llm/llmRunner.ts:112](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L112)

Interrupts and stops any active generation call on this runner.

#### Returns

`void`
