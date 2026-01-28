# Interface: ClassificationType

Defined in: [packages/react-native-executorch/src/types/classification.ts:20](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/classification.ts#L20)

Return type for the `useClassification` hook.
Manages the state and operations for Computer Vision image classification.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/classification.ts:39](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/classification.ts#L39)

Represents the download progress of the model binary as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/classification.ts:24](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/classification.ts#L24)

Contains the error object if the model failed to load, download, or encountered a runtime error during classification.

***

### forward()

> **forward**: (`imageSource`) => `Promise`\<\{\[`category`: `string`\]: `number`; \}\>

Defined in: [packages/react-native-executorch/src/types/classification.ts:47](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/classification.ts#L47)

Executes the model's forward pass to classify the provided image.

#### Parameters

##### imageSource

`string`

A string representing the image source (e.g., a file path, URI, or base64 string) to be classified.

#### Returns

`Promise`\<\{\[`category`: `string`\]: `number`; \}\>

A Promise that resolves to the classification result (typically containing labels and confidence scores).

#### Throws

If the model is not loaded or is currently processing another image.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/classification.ts:34](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/classification.ts#L34)

Indicates whether the model is currently processing an image.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/classification.ts:29](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/classification.ts#L29)

Indicates whether the classification model is loaded and ready to process images.
