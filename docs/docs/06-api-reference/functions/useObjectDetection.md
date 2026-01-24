# Function: useObjectDetection()

> **useObjectDetection**(`__namedParameters`): `object`

Defined in: [packages/react-native-executorch/src/hooks/computer\_vision/useObjectDetection.ts:10](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/hooks/computer_vision/useObjectDetection.ts#L10)

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

> **forward**: (...`input`) => `Promise`\<[`Detection`](../interfaces/Detection.md)[]\>

#### Parameters

##### input

...\[`string`, `number`\]

#### Returns

`Promise`\<[`Detection`](../interfaces/Detection.md)[]\>

### isGenerating

> **isGenerating**: `boolean`

Indicates whether the model is currently generating a response.

### isReady

> **isReady**: `boolean`

Indicates whether the model is ready.
