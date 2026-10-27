# Function: createChatPreprocessor()

> **createChatPreprocessor**(`config`): [`ChatPreprocessor`](../type-aliases/ChatPreprocessor.md)

Defined in: [extensions/llm/utils/chatPreprocessor.ts:310](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L310)

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
