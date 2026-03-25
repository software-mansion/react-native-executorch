# Interface: TextEmbeddingsType

Defined in: [types/textEmbeddings.ts:46](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/textEmbeddings.ts#L46)

React hook state and methods for managing a Text Embeddings model instance.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/textEmbeddings.ts:65](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/textEmbeddings.ts#L65)

Tracks the progress of the model download process (value between 0 and 1).

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/textEmbeddings.ts:50](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/textEmbeddings.ts#L50)

Contains the error message if the model failed to load or during inference.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/textEmbeddings.ts:60](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/textEmbeddings.ts#L60)

Indicates whether the model is currently generating embeddings.

***

### isReady

> **isReady**: `boolean`

Defined in: [types/textEmbeddings.ts:55](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/textEmbeddings.ts#L55)

Indicates whether the embeddings model has successfully loaded and is ready for inference.

## Methods

### forward()

> **forward**(`input`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [types/textEmbeddings.ts:73](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/textEmbeddings.ts#L73)

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
