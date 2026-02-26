# Variable: parseToolCall()

> `const` **parseToolCall**: (`message`) => [`ToolCall`](../interfaces/ToolCall.md)[]

Defined in: [utils/llm.ts:15](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/utils/llm.ts#L15)

Parses tool calls from a given message string.

## Parameters

### message

`string`

The message string containing tool calls in JSON format.

## Returns

[`ToolCall`](../interfaces/ToolCall.md)[]

An array of `ToolCall` objects extracted from the message.
