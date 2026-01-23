# Function: useImageSegmentation()

> **useImageSegmentation**(`__namedParameters`): `object`

Defined in: [packages/react-native-executorch/src/hooks/computer\_vision/useImageSegmentation.ts:10](https://github.com/software-mansion/react-native-executorch/blob/58509193bdce6956ca0a9f447a97326983ae2e83/packages/react-native-executorch/src/hooks/computer_vision/useImageSegmentation.ts#L10)

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

> **forward**: (...`input`) => `Promise`\<\{ `0?`: `number`[]; `1?`: `number`[]; `10?`: `number`[]; `11?`: `number`[]; `12?`: `number`[]; `13?`: `number`[]; `14?`: `number`[]; `15?`: `number`[]; `16?`: `number`[]; `17?`: `number`[]; `18?`: `number`[]; `19?`: `number`[]; `2?`: `number`[]; `20?`: `number`[]; `21?`: `number`[]; `3?`: `number`[]; `4?`: `number`[]; `5?`: `number`[]; `6?`: `number`[]; `7?`: `number`[]; `8?`: `number`[]; `9?`: `number`[]; \}\>

This function runs the model's forward method with the provided input arguments.

#### Parameters

##### input

...\[`string`, [`DeeplabLabel`](../enumerations/DeeplabLabel.md)[], `boolean`\]

Input arguments for the model's forward method.

#### Returns

`Promise`\<\{ `0?`: `number`[]; `1?`: `number`[]; `10?`: `number`[]; `11?`: `number`[]; `12?`: `number`[]; `13?`: `number`[]; `14?`: `number`[]; `15?`: `number`[]; `16?`: `number`[]; `17?`: `number`[]; `18?`: `number`[]; `19?`: `number`[]; `2?`: `number`[]; `20?`: `number`[]; `21?`: `number`[]; `3?`: `number`[]; `4?`: `number`[]; `5?`: `number`[]; `6?`: `number`[]; `7?`: `number`[]; `8?`: `number`[]; `9?`: `number`[]; \}\>

The output from the model's forward method.

### isGenerating

> **isGenerating**: `boolean`

Indicates whether the model is currently generating a response.

### isReady

> **isReady**: `boolean`

Indicates whether the model is ready.
