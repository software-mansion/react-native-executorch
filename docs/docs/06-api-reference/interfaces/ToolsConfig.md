# Interface: ToolsConfig

Defined in: [types/llm.ts:216](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L216)

Object configuring options for enabling and managing tool use. **It will only have effect if your model's chat template support it**.

## Properties

### displayToolCalls?

> `optional` **displayToolCalls**: `boolean`

Defined in: [types/llm.ts:219](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L219)

If set to true, JSON tool calls will be displayed in chat. If false, only answers will be displayed.

---

### executeToolCallback()

> **executeToolCallback**: (`call`) => `Promise`\<`string` \| `null`\>

Defined in: [types/llm.ts:218](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L218)

Function that accepts `ToolCall`, executes tool and returns the string to model.

#### Parameters

##### call

[`ToolCall`](ToolCall.md)

#### Returns

`Promise`\<`string` \| `null`\>

---

### tools

> **tools**: `Object`[]

Defined in: [types/llm.ts:217](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/llm.ts#L217)

List of objects defining tools.
