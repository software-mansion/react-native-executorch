# Variable: parseToolCall()

> `const` **parseToolCall**: (`message`) => [`ToolCall`](../interfaces/ToolCall.md)[]

Defined in: [packages/react-native-executorch/src/utils/llm.ts:16](https://github.com/software-mansion/react-native-executorch/blob/d2a421e89661061da4ea192880e5bbf8f1b7a7be/packages/react-native-executorch/src/utils/llm.ts#L16)

Parses tool calls from a given message string.

## Parameters

### message

`string`

The message string containing tool calls in JSON format.

## Returns

[`ToolCall`](../interfaces/ToolCall.md)[]

An array of `ToolCall` objects extracted from the message.
