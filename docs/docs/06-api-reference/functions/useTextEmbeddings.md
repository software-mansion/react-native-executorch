# Function: useTextEmbeddings()

> **useTextEmbeddings**(`__namedParameters`): `object`

Defined in: [packages/react-native-executorch/src/hooks/natural_language_processing/useTextEmbeddings.ts:13](https://github.com/software-mansion/react-native-executorch/blob/da1b9b6f6bcd0c76e913caeb68a23a84a79badba/packages/react-native-executorch/src/hooks/natural_language_processing/useTextEmbeddings.ts#L13)

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

> **forward**: (...`input`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

#### Parameters

##### input

...\[`string`\]

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

### isGenerating

> **isGenerating**: `boolean`

### isReady

> **isReady**: `boolean`
