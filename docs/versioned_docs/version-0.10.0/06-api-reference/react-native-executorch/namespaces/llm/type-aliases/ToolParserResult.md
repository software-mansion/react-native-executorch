# Type Alias: ToolParserResult

> **ToolParserResult** = `object`

Defined in: [extensions/llm/utils/toolCalling.ts:66](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L66)

Structured tool parsing result containing detected tool calls and remaining text.

## Properties

### textContent?

> `readonly` `optional` **textContent**: `string`

Defined in: [extensions/llm/utils/toolCalling.ts:70](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L70)

Remaining text content after tool call extraction.

---

### toolCalls

> `readonly` **toolCalls**: readonly [`ToolCall`](ToolCall.md)[]

Defined in: [extensions/llm/utils/toolCalling.ts:68](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L68)

Detected tool calls extracted from the model output.
