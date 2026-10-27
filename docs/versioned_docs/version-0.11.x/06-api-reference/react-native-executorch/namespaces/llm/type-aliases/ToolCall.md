# Type Alias: ToolCall

> **ToolCall** = `object`

Defined in: [extensions/llm/utils/toolCalling.ts:49](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L49)

Function call object embedded inside assistant tool_calls.

## Properties

### function

> `readonly` **function**: `object`

Defined in: [extensions/llm/utils/toolCalling.ts:54](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L54)

#### arguments

> `readonly` **arguments**: `Record`\<`string`, `unknown`\>

Parsed arguments passed to the function.

#### name

> `readonly` **name**: `string`

Name of the function being called.

---

### id?

> `readonly` `optional` **id**: `string`

Defined in: [extensions/llm/utils/toolCalling.ts:51](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L51)

Optional tool call identifier for matching responses.

---

### type?

> `readonly` `optional` **type**: `"function"` \| `string`

Defined in: [extensions/llm/utils/toolCalling.ts:53](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L53)

Tool type discriminator, typically `'function'`.
