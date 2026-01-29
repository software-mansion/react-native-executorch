# Interface: ClassificationType

Defined in: [packages/react-native-executorch/src/types/classification.ts:23](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/classification.ts#L23)

Return type for the `useClassification` hook.
Manages the state and operations for Computer Vision image classification.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/classification.ts:42](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/classification.ts#L42)

Represents the download progress of the model binary as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/classification.ts:27](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/classification.ts#L27)

Contains the error object if the model failed to load, download, or encountered a runtime error during classification.

***

### forward()

> **forward**: (`imageSource`) => `Promise`\<\{\[`category`: `string`\]: `number`; \}\>

Defined in: [packages/react-native-executorch/src/types/classification.ts:50](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/classification.ts#L50)

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

Defined in: [packages/react-native-executorch/src/types/classification.ts:37](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/classification.ts#L37)

Indicates whether the model is currently processing an image.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/classification.ts:32](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/classification.ts#L32)

Indicates whether the classification model is loaded and ready to process images.
