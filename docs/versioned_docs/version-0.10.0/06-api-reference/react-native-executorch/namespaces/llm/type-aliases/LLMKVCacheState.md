# Type Alias: LLMKVCacheState

> **LLMKVCacheState** = `object`

Defined in: [extensions/llm/llmRunner.ts:78](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L78)

**`Experimental`**

Current KV cache state and capacity metrics for an LLM runner.
This API is experimental and might change in future releases.

## Properties

### maxSeqLen

> `readonly` **maxSeqLen**: `number`

Defined in: [extensions/llm/llmRunner.ts:82](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L82)

Maximum token capacity (context window) supported by the model.

---

### pos

> `readonly` **pos**: `number`

Defined in: [extensions/llm/llmRunner.ts:80](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L80)

Current token position index / number of occupied tokens in the KV cache.

---

### remainingTokens

> `readonly` **remainingTokens**: `number`

Defined in: [extensions/llm/llmRunner.ts:84](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L84)

Remaining token capacity before the context window is full.

---

### usageRatio

> `readonly` **usageRatio**: `number`

Defined in: [extensions/llm/llmRunner.ts:86](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L86)

Fraction of the context window currently occupied (0.0 to 1.0).
