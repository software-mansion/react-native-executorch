# Function: createChatPreprocessor()

> **createChatPreprocessor**(`config`): [`ChatPreprocessor`](../type-aliases/ChatPreprocessor.md)

Defined in: [extensions/llm/utils/chatPreprocessor.ts:304](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L304)

Handles Jinja template formatting and media tensor preprocessing for chat
turns.

## Parameters

### config

[`ChatPreprocessorConfig`](../type-aliases/ChatPreprocessorConfig.md)

Preprocessor configuration including template and preprocessor
settings.

## Returns

[`ChatPreprocessor`](../type-aliases/ChatPreprocessor.md)

A ChatPreprocessor object containing process, render, buildPrompt,
clear, and dispose methods.
