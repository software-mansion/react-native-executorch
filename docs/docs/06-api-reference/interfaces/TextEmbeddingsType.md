# Interface: TextEmbeddingsType

Defined in: [types/textEmbeddings.ts:28](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/textEmbeddings.ts#L28)

React hook state and methods for managing a Text Embeddings model instance.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/textEmbeddings.ts:47](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/textEmbeddings.ts#L47)

Tracks the progress of the model download process (value between 0 and 1).

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/textEmbeddings.ts:32](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/textEmbeddings.ts#L32)

Contains the error message if the model failed to load or during inference.

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/textEmbeddings.ts:42](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/textEmbeddings.ts#L42)

Indicates whether the model is currently generating embeddings.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/textEmbeddings.ts:37](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/textEmbeddings.ts#L37)

Indicates whether the embeddings model has successfully loaded and is ready for inference.

## Methods

### forward()

> **forward**(`input`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [types/textEmbeddings.ts:55](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/textEmbeddings.ts#L55)

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
