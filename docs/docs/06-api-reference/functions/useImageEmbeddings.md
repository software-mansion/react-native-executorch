# Function: useImageEmbeddings()

> **useImageEmbeddings**(`ImageEmbeddingsConfiguration`): `object`

Defined in: [packages/react-native-executorch/src/hooks/computer\_vision/useImageEmbeddings.ts:11](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/hooks/computer_vision/useImageEmbeddings.ts#L11)

React hook for managing an Image Embeddings model instance.

## Parameters

### ImageEmbeddingsConfiguration

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
