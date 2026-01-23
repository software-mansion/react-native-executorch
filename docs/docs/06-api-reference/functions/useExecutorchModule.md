# Function: useExecutorchModule()

> **useExecutorchModule**(`__namedParameters`): `object`

Defined in: [packages/react-native-executorch/src/hooks/general/useExecutorchModule.ts:10](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/hooks/general/useExecutorchModule.ts#L10)

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

> **forward**: (...`input`) => `Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

This function runs the model's forward method with the provided input arguments.

#### Parameters

##### input

...\[[`TensorPtr`](../interfaces/TensorPtr.md)[]\]

Input arguments for the model's forward method.

#### Returns

`Promise`\<[`TensorPtr`](../interfaces/TensorPtr.md)[]\>

The output from the model's forward method.

### isGenerating

> **isGenerating**: `boolean`

Indicates whether the model is currently generating a response.

### isReady

> **isReady**: `boolean`

Indicates whether the model is ready.
