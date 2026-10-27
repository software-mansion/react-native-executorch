# Type Alias: LLMImagePreprocessorConfig

> **LLMImagePreprocessorConfig** = `object`

Defined in: [extensions/llm/utils/chatPreprocessor.ts:47](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L47)

Image preprocessing and sentinel token config for vision-language LLMs.

## Properties

### preprocessorOpts

> `readonly` **preprocessorOpts**: [`ImagePreprocessorOptions`](../../cv/type-aliases/ImagePreprocessorOptions.md)

Defined in: [extensions/llm/utils/chatPreprocessor.ts:53](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L53)

Image preprocessing options (normalization, resize mode, interpolation).

---

### targetShape

> `readonly` **targetShape**: readonly \[`number`, `number`, `number`\]

Defined in: [extensions/llm/utils/chatPreprocessor.ts:51](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L51)

Fixed target shape expected by native LLM `[C, H, W]`.

---

### visionToken

> `readonly` **visionToken**: `object`

Defined in: [extensions/llm/utils/chatPreprocessor.ts:49](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L49)

Sentinel token delimiters inserted into Jinja prompts.

#### end

> `readonly` **end**: `string`

#### start

> `readonly` **start**: `string`
