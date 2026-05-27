# Variable: parseToolCall()

> `const` **parseToolCall**: (`message`) => [`ToolCall`](../interfaces/ToolCall.md)[]

Defined in: [utils/llm.ts:21](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/utils/llm.ts#L21)

Parses tool calls from a given message string.

## Parameters

### message

`string`

The message string containing tool calls in JSON format.

## Returns

[`ToolCall`](../interfaces/ToolCall.md)[]

An array of `ToolCall` objects extracted from the message. Returns
an empty array if the model did not emit a `[...]` block (i.e. chose not
to call any tool).

## Throws

`InvalidModelOutput` when a `[...]` block is
present but cannot be parsed as JSON — distinct from the model
legitimately deciding not to invoke a tool.
