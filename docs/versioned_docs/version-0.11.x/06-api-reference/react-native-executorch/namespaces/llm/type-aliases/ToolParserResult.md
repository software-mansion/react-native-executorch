# Type Alias: ToolParserResult

> **ToolParserResult** = `object`

Defined in: [extensions/llm/utils/toolCalling.ts:66](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L66)

Structured tool parsing result containing detected tool calls and remaining text.

## Properties

### textContent?

> `readonly` `optional` **textContent**: `string`

Defined in: [extensions/llm/utils/toolCalling.ts:70](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L70)

Remaining text content after tool call extraction.

---

### toolCalls

> `readonly` **toolCalls**: readonly [`ToolCall`](ToolCall.md)[]

Defined in: [extensions/llm/utils/toolCalling.ts:68](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L68)

Detected tool calls extracted from the model output.
