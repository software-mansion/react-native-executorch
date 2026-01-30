# Variable: parseToolCall()

> `const` **parseToolCall**: (`message`) => [`ToolCall`](../interfaces/ToolCall.md)[]

Defined in: [packages/react-native-executorch/src/utils/llm.ts:16](https://github.com/software-mansion/react-native-executorch/blob/4bb7c5e39cad5e7f0481e1bb508135978edc9be2/packages/react-native-executorch/src/utils/llm.ts#L16)

Parses tool calls from a given message string.

## Parameters

### message

`string`

The message string containing tool calls in JSON format.

## Returns

[`ToolCall`](../interfaces/ToolCall.md)[]

An array of `ToolCall` objects extracted from the message.
