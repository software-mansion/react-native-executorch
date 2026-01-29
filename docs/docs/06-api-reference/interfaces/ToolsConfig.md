# Interface: ToolsConfig

Defined in: [packages/react-native-executorch/src/types/llm.ts:223](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/llm.ts#L223)

Object configuring options for enabling and managing tool use. **It will only have effect if your model's chat template support it**.

## Properties

### displayToolCalls?

> `optional` **displayToolCalls**: `boolean`

Defined in: [packages/react-native-executorch/src/types/llm.ts:226](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/llm.ts#L226)

If set to true, JSON tool calls will be displayed in chat. If false, only answers will be displayed.

***

### executeToolCallback()

> **executeToolCallback**: (`call`) => `Promise`\<`string` \| `null`\>

Defined in: [packages/react-native-executorch/src/types/llm.ts:225](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/llm.ts#L225)

Function that accepts `ToolCall`, executes tool and returns the string to model.

#### Parameters

##### call

[`ToolCall`](ToolCall.md)

#### Returns

`Promise`\<`string` \| `null`\>

***

### tools

> **tools**: `Object`[]

Defined in: [packages/react-native-executorch/src/types/llm.ts:224](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/llm.ts#L224)

List of objects defining tools.
