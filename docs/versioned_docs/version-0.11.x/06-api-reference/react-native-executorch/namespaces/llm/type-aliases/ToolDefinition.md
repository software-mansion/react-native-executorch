# Type Alias: ToolDefinition\<Args\>

> **ToolDefinition**\<`Args`\> = `object`

Defined in: [extensions/llm/utils/toolCalling.ts:26](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L26)

Declaration of a tool available to the model.

## Type Parameters

### Args

`Args` _extends_ `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Properties

### execute()

> `readonly` **execute**: (`args`) => `Promise`\<[`ChatMessageContent`](ChatMessageContent.md)\> \| [`ChatMessageContent`](ChatMessageContent.md)

Defined in: [extensions/llm/utils/toolCalling.ts:42](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L42)

Execution callback invoked automatically when the model calls this tool.

#### Parameters

##### args

`Args`

#### Returns

`Promise`\<[`ChatMessageContent`](ChatMessageContent.md)\> \| [`ChatMessageContent`](ChatMessageContent.md)

---

### function

> `readonly` **function**: `object`

Defined in: [extensions/llm/utils/toolCalling.ts:29](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L29)

#### Index Signature

\[`key`: `string`\]: `unknown`

#### description?

> `readonly` `optional` **description**: `string`

Human-readable description of what the tool does.

#### name

> `readonly` **name**: `string`

Function name the model should invoke.

#### parameters?

> `readonly` `optional` **parameters**: [`ToolParameters`](ToolParameters.md)

JSON Schema describing the function's parameters.

---

### type

> `readonly` **type**: `"function"` \| `string`

Defined in: [extensions/llm/utils/toolCalling.ts:28](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L28)

Tool type discriminator, typically `'function'`.
