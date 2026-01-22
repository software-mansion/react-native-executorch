# Function: useVAD()

> **useVAD**(`__namedParameters`): `object`

Defined in: [packages/react-native-executorch/src/hooks/natural_language_processing/useVAD.ts:10](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/hooks/natural_language_processing/useVAD.ts#L10)

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

> **forward**: (...`input`) => `Promise`\<[`Segment`](../interfaces/Segment.md)[]\>

This function runs the model's forward method with the provided input arguments.

#### Parameters

##### input

...\[`Float32Array`\<`ArrayBufferLike`\>\]

Input arguments for the model's forward method.

#### Returns

`Promise`\<[`Segment`](../interfaces/Segment.md)[]\>

The output from the model's forward method.

### isGenerating

> **isGenerating**: `boolean`

Indicates whether the model is currently generating a response.

### isReady

> **isReady**: `boolean`

Indicates whether the model is ready.
