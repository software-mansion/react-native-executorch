# Type Alias: LLMPrefillStats

> **LLMPrefillStats** = `object`

Defined in: [extensions/llm/llmRunner.ts:44](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L44)

Execution and performance statistics for a prefill phase.

## Properties

### durationMs

> `readonly` **durationMs**: `number`

Defined in: [extensions/llm/llmRunner.ts:48](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L48)

Duration in milliseconds spent in prefill.

---

### numTokens

> `readonly` **numTokens**: `number`

Defined in: [extensions/llm/llmRunner.ts:46](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L46)

Number of tokens processed during prefill.

---

### tokensPerSecond

> `readonly` **tokensPerSecond**: `number`

Defined in: [extensions/llm/llmRunner.ts:50](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L50)

Prefill throughput in tokens per second.
