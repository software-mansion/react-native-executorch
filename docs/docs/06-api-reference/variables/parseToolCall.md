# Variable: parseToolCall()

> `const` **parseToolCall**: (`message`) => [`ToolCall`](../interfaces/ToolCall.md)[]

Defined in: [packages/react-native-executorch/src/utils/llm.ts:16](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/utils/llm.ts#L16)

Parses tool calls from a given message string.

## Parameters

### message

`string`

The message string containing tool calls in JSON format.

## Returns

[`ToolCall`](../interfaces/ToolCall.md)[]

An array of `ToolCall` objects extracted from the message.
