# Function: useStyleTransfer()

> **useStyleTransfer**(`__namedParameters`): `object`

Defined in: [packages/react-native-executorch/src/hooks/computer\_vision/useStyleTransfer.ts:10](https://github.com/software-mansion/react-native-executorch/blob/ac6840354d6a7d08dd7f9e5b0ae0fc23eca7922d/packages/react-native-executorch/src/hooks/computer_vision/useStyleTransfer.ts#L10)

## Parameters

### \_\_namedParameters

`Props`

## Returns

### downloadProgress

> **downloadProgress**: `number`

Represents the download progress as a value between 0 and 1, indicating the extent of the model file retrieval.

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Contains the error message if the model failed to load.

### forward()

> **forward**: (...`input`) => `Promise`\<`string`\>

#### Parameters

##### input

...\[`string`\]

#### Returns

`Promise`\<`string`\>

### isGenerating

> **isGenerating**: `boolean`

Indicates whether the model is currently generating a response.

### isReady

> **isReady**: `boolean`

Indicates whether the model is ready.
