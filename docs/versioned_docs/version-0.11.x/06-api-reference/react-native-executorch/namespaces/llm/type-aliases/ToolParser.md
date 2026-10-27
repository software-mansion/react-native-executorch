# Type Alias: ToolParser()

> **ToolParser** = (`text`) => [`ToolParserResult`](ToolParserResult.md) \| `undefined`

Defined in: [extensions/llm/utils/toolCalling.ts:78](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L78)

Function signature for parsing tool calls from model output text.
Returns undefined if no tool call was detected.

## Parameters

### text

`string`

## Returns

[`ToolParserResult`](ToolParserResult.md) \| `undefined`
