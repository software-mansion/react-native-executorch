# Type Alias: LLMKVCacheState

> **LLMKVCacheState** = `object`

Defined in: [extensions/llm/llmRunner.ts:92](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L92)

Current KV cache state and capacity metrics for an LLM runner.

## Properties

### maxContextLen

> `readonly` **maxContextLen**: `number`

Defined in: [extensions/llm/llmRunner.ts:96](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L96)

Maximum token capacity (context window) supported by the model.

---

### pos

> `readonly` **pos**: `number`

Defined in: [extensions/llm/llmRunner.ts:94](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L94)

Current token position index / number of occupied tokens in the KV cache.

---

### remainingTokens

> `readonly` **remainingTokens**: `number`

Defined in: [extensions/llm/llmRunner.ts:98](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L98)

Remaining token capacity before the context window is full.

---

### usageRatio

> `readonly` **usageRatio**: `number`

Defined in: [extensions/llm/llmRunner.ts:100](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L100)

Fraction of the context window currently occupied (0.0 to 1.0).
