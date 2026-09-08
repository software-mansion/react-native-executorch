# Type Alias: ToolParser()

> **ToolParser** = (`text`) => [`ToolParserResult`](ToolParserResult.md) \| `undefined`

Defined in: [extensions/llm/utils/toolCalling.ts:78](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L78)

Function signature for parsing tool calls from model output text.
Returns undefined if no tool call was detected.

## Parameters

### text

`string`

## Returns

[`ToolParserResult`](ToolParserResult.md) \| `undefined`
