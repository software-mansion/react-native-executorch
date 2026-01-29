# Variable: parseToolCall()

> `const` **parseToolCall**: (`message`) => [`ToolCall`](../interfaces/ToolCall.md)[]

Defined in: [packages/react-native-executorch/src/utils/llm.ts:16](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/utils/llm.ts#L16)

Parses tool calls from a given message string.

## Parameters

### message

`string`

The message string containing tool calls in JSON format.

## Returns

[`ToolCall`](../interfaces/ToolCall.md)[]

An array of `ToolCall` objects extracted from the message.
