# Interface: ToolsConfig

Defined in: [types/llm.ts:313](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L313)

Object configuring options for enabling and managing tool use. **It will only have effect if your model's chat template support it**.

## Properties

### displayToolCalls?

> `optional` **displayToolCalls**: `boolean`

Defined in: [types/llm.ts:316](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L316)

If set to true, JSON tool calls will be displayed in chat. If false, only answers will be displayed.

***

### executeToolCallback()

> **executeToolCallback**: (`call`) => `Promise`\<`string` \| `null`\>

Defined in: [types/llm.ts:315](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L315)

Function that accepts `ToolCall`, executes tool and returns the string to model.

#### Parameters

##### call

[`ToolCall`](ToolCall.md)

#### Returns

`Promise`\<`string` \| `null`\>

***

### tools

> **tools**: `Object`[]

Defined in: [types/llm.ts:314](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/llm.ts#L314)

List of objects defining tools.
