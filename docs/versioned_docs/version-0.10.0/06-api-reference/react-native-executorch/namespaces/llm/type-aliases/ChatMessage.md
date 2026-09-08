# Type Alias: ChatMessage

> **ChatMessage** = `Readonly`\<\{ `content`: [`ChatMessageContent`](ChatMessageContent.md); `role`: `"system"` \| `"user"`; \} \| \{ `content?`: [`ChatMessageContent`](ChatMessageContent.md); `role`: `"assistant"`; `toolCalls?`: readonly [`ToolCall`](ToolCall.md)[]; \} \| \{ `content`: [`ChatMessageContent`](ChatMessageContent.md); `name?`: `string`; `role`: `"tool"`; `toolCallId?`: `string`; \}\>

Defined in: [extensions/llm/utils/chatPreprocessor.ts:37](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/chatPreprocessor.ts#L37)

Conversation turn representing system, user, assistant, or tool execution messages.
