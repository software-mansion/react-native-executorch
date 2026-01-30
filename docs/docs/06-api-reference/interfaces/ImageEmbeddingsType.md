# Interface: ImageEmbeddingsType

Defined in: [packages/react-native-executorch/src/types/imageEmbeddings.ts:23](https://github.com/software-mansion/react-native-executorch/blob/7e10c820da55c41850b183cae64d67ab1e216a67/packages/react-native-executorch/src/types/imageEmbeddings.ts#L23)

Return type for the `useImageEmbeddings` hook.
Manages the state and operations for generating image embeddings (feature vectors) used in Computer Vision tasks.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/imageEmbeddings.ts:42](https://github.com/software-mansion/react-native-executorch/blob/7e10c820da55c41850b183cae64d67ab1e216a67/packages/react-native-executorch/src/types/imageEmbeddings.ts#L42)

Represents the download progress of the model binary as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/imageEmbeddings.ts:27](https://github.com/software-mansion/react-native-executorch/blob/7e10c820da55c41850b183cae64d67ab1e216a67/packages/react-native-executorch/src/types/imageEmbeddings.ts#L27)

Contains the error object if the model failed to load, download, or encountered a runtime error during embedding generation.

***

### forward()

> **forward**: (`imageSource`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/types/imageEmbeddings.ts:50](https://github.com/software-mansion/react-native-executorch/blob/7e10c820da55c41850b183cae64d67ab1e216a67/packages/react-native-executorch/src/types/imageEmbeddings.ts#L50)

Executes the model's forward pass to generate embeddings (a feature vector) for the provided image.

#### Parameters

##### imageSource

`string`

A string representing the image source (e.g., a file path, URI, or base64 string) to be processed.

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A Promise that resolves to a `Float32Array` containing the generated embedding vector.

#### Throws

If the model is not loaded or is currently processing another image.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/imageEmbeddings.ts:37](https://github.com/software-mansion/react-native-executorch/blob/7e10c820da55c41850b183cae64d67ab1e216a67/packages/react-native-executorch/src/types/imageEmbeddings.ts#L37)

Indicates whether the model is currently generating embeddings for an image.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/imageEmbeddings.ts:32](https://github.com/software-mansion/react-native-executorch/blob/7e10c820da55c41850b183cae64d67ab1e216a67/packages/react-native-executorch/src/types/imageEmbeddings.ts#L32)

Indicates whether the image embeddings model is loaded and ready to process images.
