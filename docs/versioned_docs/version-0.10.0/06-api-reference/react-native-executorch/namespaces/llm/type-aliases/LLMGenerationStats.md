# Type Alias: LLMGenerationStats

> **LLMGenerationStats** = `object`

Defined in: [extensions/llm/llmRunner.ts:31](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L31)

**`Experimental`**

Execution and performance statistics for a generation call.
This API is experimental and might change in future releases.

## Properties

### firstTokenMs

> `readonly` **firstTokenMs**: `number`

Defined in: [extensions/llm/llmRunner.ts:37](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L37)

Timestamp in milliseconds when the first token was generated.

---

### inferenceEndMs

> `readonly` **inferenceEndMs**: `number`

Defined in: [extensions/llm/llmRunner.ts:43](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L43)

Timestamp in milliseconds when inference completed.

---

### inferenceStartMs

> `readonly` **inferenceStartMs**: `number`

Defined in: [extensions/llm/llmRunner.ts:41](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L41)

Timestamp in milliseconds when inference started.

---

### modelLoadEndMs

> `readonly` **modelLoadEndMs**: `number`

Defined in: [extensions/llm/llmRunner.ts:47](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L47)

Timestamp in milliseconds when model loading completed.

---

### modelLoadStartMs

> `readonly` **modelLoadStartMs**: `number`

Defined in: [extensions/llm/llmRunner.ts:45](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L45)

Timestamp in milliseconds when model loading started.

---

### numGeneratedTokens

> `readonly` **numGeneratedTokens**: `number`

Defined in: [extensions/llm/llmRunner.ts:35](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L35)

Number of newly generated tokens.

---

### numPromptTokens

> `readonly` **numPromptTokens**: `number`

Defined in: [extensions/llm/llmRunner.ts:33](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L33)

Number of tokens in the input prompt.

---

### prefillDurationMs?

> `readonly` `optional` **prefillDurationMs**: `number`

Defined in: [extensions/llm/llmRunner.ts:39](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts#L39)

Duration in milliseconds spent in the separate prefill phase (if any).
