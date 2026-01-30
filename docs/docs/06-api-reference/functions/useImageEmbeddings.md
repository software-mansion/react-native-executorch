# Function: useImageEmbeddings()

> **useImageEmbeddings**(`ImageEmbeddingsProps`): `object`

Defined in: [packages/react-native-executorch/src/hooks/computer\_vision/useImageEmbeddings.ts:12](https://github.com/software-mansion/react-native-executorch/blob/bf7cb740914337a4d266d2cb99d42114c1e469b1/packages/react-native-executorch/src/hooks/computer_vision/useImageEmbeddings.ts#L12)

React hook for managing an Image Embeddings model instance.

## Parameters

### ImageEmbeddingsProps

[`ImageEmbeddingsProps`](../interfaces/ImageEmbeddingsProps.md)

Configuration object containing `model` source and optional `preventLoad` flag.

## Returns

Ready to use Image Embeddings model.

### downloadProgress

> **downloadProgress**: `number`

Represents the download progress as a value between 0 and 1, indicating the extent of the model file retrieval.

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Contains the error message if the model failed to load.

### forward()

> **forward**: (...`input`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

#### Parameters

##### input

...\[`string`\]

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

### isGenerating

> **isGenerating**: `boolean`

Indicates whether the model is currently generating a response.

### isReady

> **isReady**: `boolean`

Indicates whether the model is ready.
