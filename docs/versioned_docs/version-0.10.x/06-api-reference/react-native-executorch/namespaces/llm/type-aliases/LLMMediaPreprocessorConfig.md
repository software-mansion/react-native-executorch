# Type Alias: LLMMediaPreprocessorConfig

> **LLMMediaPreprocessorConfig** = `object`

Defined in: [extensions/llm/utils/chatPreprocessor.ts:69](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L69)

Preprocessor configuration for media modalities.

## Properties

### audio?

> `readonly` `optional` **audio**: [`LLMAudioPreprocessorConfig`](LLMAudioPreprocessorConfig.md)

Defined in: [extensions/llm/utils/chatPreprocessor.ts:73](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L73)

Audio preprocessing configuration for audio-language models.

---

### image?

> `readonly` `optional` **image**: [`LLMImagePreprocessorConfig`](LLMImagePreprocessorConfig.md)

Defined in: [extensions/llm/utils/chatPreprocessor.ts:71](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L71)

Image preprocessing configuration for vision-language models.
