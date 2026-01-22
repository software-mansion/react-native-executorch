# Interface: ToolsConfig

Defined in: [packages/react-native-executorch/src/types/llm.ts:175](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/types/llm.ts#L175)

Object configuring options for enabling and managing tool use. **It will only have effect if your model's chat template support it**.

## Properties

### displayToolCalls?

> `optional` **displayToolCalls**: `boolean`

Defined in: [packages/react-native-executorch/src/types/llm.ts:189](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/types/llm.ts#L189)

If set to true, JSON tool calls will be displayed in chat. If false, only answers will be displayed.

---

### executeToolCallback()

> **executeToolCallback**: (`call`) => `Promise`\<`string` \| `null`\>

Defined in: [packages/react-native-executorch/src/types/llm.ts:184](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/types/llm.ts#L184)

Function that accepts `ToolCall`, executes tool and returns the string to model.

#### Parameters

##### call

[`ToolCall`](ToolCall.md)

#### Returns

`Promise`\<`string` \| `null`\>

---

### tools

> **tools**: `Object`[]

Defined in: [packages/react-native-executorch/src/types/llm.ts:179](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/types/llm.ts#L179)

List of objects defining tools.
