# Interface: ImageEmbeddingsType

Defined in: [types/imageEmbeddings.ts:30](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/imageEmbeddings.ts#L30)

Return type for the `useImageEmbeddings` hook.
Manages the state and operations for generating image embeddings (feature vectors) used in Computer Vision tasks.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/imageEmbeddings.ts:49](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/imageEmbeddings.ts#L49)

Represents the download progress of the model binary as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/imageEmbeddings.ts:34](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/imageEmbeddings.ts#L34)

Contains the error object if the model failed to load, download, or encountered a runtime error during embedding generation.

***

### forward()

> **forward**: (`input`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [types/imageEmbeddings.ts:63](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/imageEmbeddings.ts#L63)

Executes the model's forward pass to generate embeddings (a feature vector) for the provided image.

Supports two input types:
1. **String path/URI**: File path, URL, or Base64-encoded string
2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)

**Note**: For VisionCamera frame processing, use `runOnFrame` instead.

#### Parameters

##### input

Image source (string or [PixelData](PixelData.md) object)

`string` | [`PixelData`](PixelData.md)

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A Promise that resolves to a `Float32Array` containing the generated embedding vector.

#### Throws

If the model is not loaded or is currently processing another image.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/imageEmbeddings.ts:44](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/imageEmbeddings.ts#L44)

Indicates whether the model is currently generating embeddings for an image.

***

### isReady

> **isReady**: `boolean`

Defined in: [types/imageEmbeddings.ts:39](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/imageEmbeddings.ts#L39)

Indicates whether the image embeddings model is loaded and ready to process images.

***

### runOnFrame

> **runOnFrame**: (`frame`) => `Float32Array` \| `null`

Defined in: [types/imageEmbeddings.ts:76](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/imageEmbeddings.ts#L76)

Synchronous worklet function for real-time VisionCamera frame processing.
Automatically handles native buffer extraction and cleanup.

**Use this for VisionCamera frame processing in worklets.**
For async processing, use `forward()` instead.

Available after model is loaded (`isReady: true`).

#### Param

VisionCamera Frame object

#### Returns

Float32Array containing the embedding vector for the frame.
