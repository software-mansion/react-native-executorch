# Function: useObjectDetection()

> **useObjectDetection**(`__namedParameters`): `object`

Defined in: [packages/react-native-executorch/src/hooks/computer_vision/useObjectDetection.ts:10](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/hooks/computer_vision/useObjectDetection.ts#L10)

## Parameters

### \_\_namedParameters

`Props`

## Returns

`object`

### downloadProgress

> **downloadProgress**: `number`

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

### forward()

> **forward**: (...`input`) => `Promise`\<[`Detection`](../interfaces/Detection.md)[]\>

#### Parameters

##### input

...\[`string`, `number`\]

#### Returns

`Promise`\<[`Detection`](../interfaces/Detection.md)[]\>

### isGenerating

> **isGenerating**: `boolean`

### isReady

> **isReady**: `boolean`
