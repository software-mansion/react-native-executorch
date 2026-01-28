# Interface: TextEmbeddingsType

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:9](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/textEmbeddings.ts#L9)

React hook state and methods for managing a Text Embeddings model instance.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:28](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/textEmbeddings.ts#L28)

Tracks the progress of the model download process (value between 0 and 1).

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:13](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/textEmbeddings.ts#L13)

Contains the error message if the model failed to load or during inference.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:23](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/textEmbeddings.ts#L23)

Indicates whether the model is currently generating embeddings.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:18](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/textEmbeddings.ts#L18)

Indicates whether the embeddings model has successfully loaded and is ready for inference.

## Methods

### forward()

> **forward**(`input`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:36](https://github.com/software-mansion/react-native-executorch/blob/41ebfb44b8f7a0e75b79ecbd41a0ff716cb5fb5c/packages/react-native-executorch/src/types/textEmbeddings.ts#L36)

Runs the text embeddings model on the provided input string.

#### Parameters

##### input

`string`

The text string to embed.

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

A promise resolving to a Float32Array containing the vector embeddings.

#### Throws

If the model is not loaded or is currently processing another request.
