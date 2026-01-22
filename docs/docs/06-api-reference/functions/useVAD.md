# Function: useVAD()

> **useVAD**(`__namedParameters`): `object`

Defined in: [packages/react-native-executorch/src/hooks/natural_language_processing/useVAD.ts:10](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/hooks/natural_language_processing/useVAD.ts#L10)

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

> **forward**: (...`input`) => `Promise`\<[`Segment`](../interfaces/Segment.md)[]\>

#### Parameters

##### input

...\[`Float32Array`\<`ArrayBufferLike`\>\]

#### Returns

`Promise`\<[`Segment`](../interfaces/Segment.md)[]\>

### isGenerating

> **isGenerating**: `boolean`

### isReady

> **isReady**: `boolean`
