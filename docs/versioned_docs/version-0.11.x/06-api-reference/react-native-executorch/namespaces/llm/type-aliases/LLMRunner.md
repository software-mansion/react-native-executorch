# Type Alias: LLMRunner

> **LLMRunner** = `object`

Defined in: [extensions/llm/llmRunner.ts:111](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L111)

Handle to an ExecuTorch LLM runner.

A runner owns a loaded model and its tokenizer, and tracks the KV cache
position across calls, so successive `prefill` and `generate` calls continue
the same sequence until it is `reset`. Obtain one via [createLLMRunner](../functions/createLLMRunner.md).

## Properties

### modalities

> `readonly` **modalities**: readonly [`Modality`](Modality.md)[]

Defined in: [extensions/llm/llmRunner.ts:117](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L117)

List of supported non-text input modalities for this runner (e.g. `['image']`).

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/llm/llmRunner.ts:113](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L113)

Path to the local model file.

---

### tokenizerPath

> `readonly` **tokenizerPath**: `string`

Defined in: [extensions/llm/llmRunner.ts:115](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L115)

Path to the local tokenizer configuration file.

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [extensions/llm/llmRunner.ts:122](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L122)

Releases all allocated native resources.

#### Returns

`void`

---

### generate()

> **generate**(`prompt`, `config?`, `onToken?`): [`LLMGenerationStats`](LLMGenerationStats.md)

Defined in: [extensions/llm/llmRunner.ts:156](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L156)

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

Defined in: [extensions/llm/llmRunner.ts:139](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L139)

Returns current KV cache occupancy and total context capacity metrics.

#### Returns

[`LLMKVCacheState`](LLMKVCacheState.md)

---

### prefill()

> **prefill**(`prompt`, `options?`): [`LLMPrefillStats`](LLMPrefillStats.md)

Defined in: [extensions/llm/llmRunner.ts:147](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L147)

Prefills the runner with a prompt to build up the KV cache.

#### Parameters

##### prompt

[`Prompt`](Prompt.md)

The prefill text or multimodal prompt.

##### options?

`Pick`\<[`LLMGenerationConfig`](LLMGenerationConfig.md), `"prefillLen"`\>

Optional prefill chunk size.

#### Returns

[`LLMPrefillStats`](LLMPrefillStats.md)

Prefill performance statistics.

---

### reset()

> **reset**(`targetPos?`): `void`

Defined in: [extensions/llm/llmRunner.ts:134](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L134)

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

Defined in: [extensions/llm/llmRunner.ts:127](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L127)

Interrupts and stops any active generation call on this runner.

#### Returns

`void`
