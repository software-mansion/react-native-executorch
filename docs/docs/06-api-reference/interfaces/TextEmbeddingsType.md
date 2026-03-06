# Interface: TextEmbeddingsType

Defined in: [types/textEmbeddings.ts:49](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/textEmbeddings.ts#L49)

React hook state and methods for managing a Text Embeddings model instance.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/textEmbeddings.ts:68](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/textEmbeddings.ts#L68)

Tracks the progress of the model download process (value between 0 and 1).

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/textEmbeddings.ts:53](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/textEmbeddings.ts#L53)

Contains the error message if the model failed to load or during inference.

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/textEmbeddings.ts:63](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/textEmbeddings.ts#L63)

Indicates whether the model is currently generating embeddings.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/textEmbeddings.ts:58](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/textEmbeddings.ts#L58)

Indicates whether the embeddings model has successfully loaded and is ready for inference.

## Methods

### forward()

> **forward**(`input`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [types/textEmbeddings.ts:76](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/textEmbeddings.ts#L76)

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
