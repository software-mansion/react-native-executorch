# Interface: TextEmbeddingsType\<M\>

Defined in: [types/textEmbeddings.ts:123](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L123)

React hook state and methods for a Text Embeddings model instance.

## Type Parameters

### M

`M` *extends* [`TextEmbeddingsModel`](TextEmbeddingsModel.md) = [`TextEmbeddingsModel`](TextEmbeddingsModel.md)

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/textEmbeddings.ts:141](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L141)

Tracks the progress of the model download process (value between 0 and 1).

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/textEmbeddings.ts:129](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L129)

Contains the error message if the model failed to load or during inference.

***

### forward

> **forward**: [`ForwardFn`](../type-aliases/ForwardFn.md)\<`M`\>

Defined in: [types/textEmbeddings.ts:149](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L149)

Runs the text embeddings model on the provided input string.

#### Param

The text string to embed.

#### Param

Optional role for models with asymmetric prompts. Required if the model has `prompts`.

#### Returns

A promise resolving to a Float32Array or EmbeddingResult containing the vector embeddings.

#### Throws

If the model is not loaded or is currently processing another request.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/textEmbeddings.ts:137](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L137)

Indicates whether the model is currently generating embeddings.

***

### isReady

> **isReady**: `boolean`

Defined in: [types/textEmbeddings.ts:133](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/textEmbeddings.ts#L133)

Indicates whether the embeddings model has successfully loaded and is ready for inference.
