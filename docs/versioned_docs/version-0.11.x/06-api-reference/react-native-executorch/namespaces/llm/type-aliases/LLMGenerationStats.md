# Type Alias: LLMGenerationStats

> **LLMGenerationStats** = `object`

Defined in: [extensions/llm/llmRunner.ts:57](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L57)

Execution and performance statistics for a generation call.

## Properties

### durationMs

> `readonly` **durationMs**: `number`

Defined in: [extensions/llm/llmRunner.ts:61](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L61)

Duration in milliseconds spent in decode generation.

---

### numTokens

> `readonly` **numTokens**: `number`

Defined in: [extensions/llm/llmRunner.ts:59](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L59)

Number of newly generated tokens.

---

### prefill

> `readonly` **prefill**: [`LLMPrefillStats`](LLMPrefillStats.md)

Defined in: [extensions/llm/llmRunner.ts:65](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L65)

Performance statistics of the prefill phase.

---

### tokensPerSecond

> `readonly` **tokensPerSecond**: `number`

Defined in: [extensions/llm/llmRunner.ts:63](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L63)

Generation throughput in tokens per second.
