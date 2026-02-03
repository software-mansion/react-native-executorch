# Interface: TextEmbeddingsType

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:30](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/textEmbeddings.ts#L30)

React hook state and methods for managing a Text Embeddings model instance.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:49](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/textEmbeddings.ts#L49)

Tracks the progress of the model download process (value between 0 and 1).

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:34](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/textEmbeddings.ts#L34)

Contains the error message if the model failed to load or during inference.

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:44](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/textEmbeddings.ts#L44)

Indicates whether the model is currently generating embeddings.

---

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:39](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/textEmbeddings.ts#L39)

Indicates whether the embeddings model has successfully loaded and is ready for inference.

## Methods

### forward()

> **forward**(`input`): `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Defined in: [packages/react-native-executorch/src/types/textEmbeddings.ts:57](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/textEmbeddings.ts#L57)

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
