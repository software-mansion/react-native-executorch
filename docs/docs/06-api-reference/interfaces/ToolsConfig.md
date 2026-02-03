# Interface: ToolsConfig

Defined in: [packages/react-native-executorch/src/types/llm.ts:221](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/llm.ts#L221)

Object configuring options for enabling and managing tool use. **It will only have effect if your model's chat template support it**.

## Properties

### displayToolCalls?

> `optional` **displayToolCalls**: `boolean`

Defined in: [packages/react-native-executorch/src/types/llm.ts:224](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/llm.ts#L224)

If set to true, JSON tool calls will be displayed in chat. If false, only answers will be displayed.

---

### executeToolCallback()

> **executeToolCallback**: (`call`) => `Promise`\<`string` \| `null`\>

Defined in: [packages/react-native-executorch/src/types/llm.ts:223](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/llm.ts#L223)

Function that accepts `ToolCall`, executes tool and returns the string to model.

#### Parameters

##### call

[`ToolCall`](ToolCall.md)

#### Returns

`Promise`\<`string` \| `null`\>

---

### tools

> **tools**: `Object`[]

Defined in: [packages/react-native-executorch/src/types/llm.ts:222](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/llm.ts#L222)

List of objects defining tools.
