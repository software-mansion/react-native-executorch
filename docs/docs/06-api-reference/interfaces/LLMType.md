# Interface: LLMType

Defined in: [packages/react-native-executorch/src/types/llm.ts:3](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/types/llm.ts#L3)

## Properties

### configure()

> **configure**: (`__namedParameters`) => `void`

Defined in: [packages/react-native-executorch/src/types/llm.ts:11](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/types/llm.ts#L11)

#### Parameters

##### \_\_namedParameters

###### chatConfig?

`Partial`\<[`ChatConfig`](ChatConfig.md)\>

###### generationConfig?

[`GenerationConfig`](GenerationConfig.md)

###### toolsConfig?

[`ToolsConfig`](ToolsConfig.md)

#### Returns

`void`

---

### deleteMessage()

> **deleteMessage**: (`index`) => `void`

Defined in: [packages/react-native-executorch/src/types/llm.ts:23](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/types/llm.ts#L23)

#### Parameters

##### index

`number`

#### Returns

`void`

---

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:9](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/types/llm.ts#L9)

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/llm.ts:10](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/types/llm.ts#L10)

---

### generate()

> **generate**: (`messages`, `tools?`) => `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/llm.ts:21](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/types/llm.ts#L21)

#### Parameters

##### messages

[`Message`](Message.md)[]

##### tools?

`Object`[]

#### Returns

`Promise`\<`void`\>

---

### getGeneratedTokenCount()

> **getGeneratedTokenCount**: () => `number`

Defined in: [packages/react-native-executorch/src/types/llm.ts:20](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/types/llm.ts#L20)

#### Returns

`number`

---

### interrupt()

> **interrupt**: () => `void`

Defined in: [packages/react-native-executorch/src/types/llm.ts:24](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/types/llm.ts#L24)

#### Returns

`void`

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/llm.ts:8](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/types/llm.ts#L8)

---

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/llm.ts:7](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/types/llm.ts#L7)

---

### messageHistory

> **messageHistory**: [`Message`](Message.md)[]

Defined in: [packages/react-native-executorch/src/types/llm.ts:4](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/types/llm.ts#L4)

---

### response

> **response**: `string`

Defined in: [packages/react-native-executorch/src/types/llm.ts:5](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/types/llm.ts#L5)

---

### sendMessage()

> **sendMessage**: (`message`) => `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/types/llm.ts:22](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/types/llm.ts#L22)

#### Parameters

##### message

`string`

#### Returns

`Promise`\<`void`\>

---

### token

> **token**: `string`

Defined in: [packages/react-native-executorch/src/types/llm.ts:6](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/types/llm.ts#L6)
