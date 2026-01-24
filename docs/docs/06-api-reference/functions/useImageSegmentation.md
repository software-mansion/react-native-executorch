# Function: useImageSegmentation()

> **useImageSegmentation**(`__namedParameters`): `object`

Defined in: [packages/react-native-executorch/src/hooks/computer\_vision/useImageSegmentation.ts:10](https://github.com/software-mansion/react-native-executorch/blob/98ccf0be60ddbbdcffa6085f633ea6ccfd6c68f2/packages/react-native-executorch/src/hooks/computer_vision/useImageSegmentation.ts#L10)

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

#### Parameters

##### input

...\[`string`, [`DeeplabLabel`](../enumerations/DeeplabLabel.md)[], `boolean`\]

#### Returns

`Promise`\<\{ `0?`: `number`[]; `1?`: `number`[]; `10?`: `number`[]; `11?`: `number`[]; `12?`: `number`[]; `13?`: `number`[]; `14?`: `number`[]; `15?`: `number`[]; `16?`: `number`[]; `17?`: `number`[]; `18?`: `number`[]; `19?`: `number`[]; `2?`: `number`[]; `20?`: `number`[]; `21?`: `number`[]; `3?`: `number`[]; `4?`: `number`[]; `5?`: `number`[]; `6?`: `number`[]; `7?`: `number`[]; `8?`: `number`[]; `9?`: `number`[]; \}\>

### isGenerating

> **isGenerating**: `boolean`

Indicates whether the model is currently generating a response.

### isReady

> **isReady**: `boolean`

Indicates whether the model is ready.
