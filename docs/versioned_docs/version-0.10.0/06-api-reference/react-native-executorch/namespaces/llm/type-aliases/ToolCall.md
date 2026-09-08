# Type Alias: ToolCall

> **ToolCall** = `object`

Defined in: [extensions/llm/utils/toolCalling.ts:49](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L49)

Function call object embedded inside assistant tool_calls.

## Properties

### function

> `readonly` **function**: `object`

Defined in: [extensions/llm/utils/toolCalling.ts:54](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L54)

#### arguments

> `readonly` **arguments**: `Record`\<`string`, `unknown`\>

Parsed arguments passed to the function.

#### name

> `readonly` **name**: `string`

Name of the function being called.

---

### id?

> `readonly` `optional` **id**: `string`

Defined in: [extensions/llm/utils/toolCalling.ts:51](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L51)

Optional tool call identifier for matching responses.

---

### type?

> `readonly` `optional` **type**: `"function"` \| `string`

Defined in: [extensions/llm/utils/toolCalling.ts:53](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/utils/toolCalling.ts#L53)

Tool type discriminator, typically `'function'`.
