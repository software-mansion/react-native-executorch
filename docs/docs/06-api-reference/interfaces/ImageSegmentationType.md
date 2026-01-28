# Interface: ImageSegmentationType

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:49](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/imageSegmentation.ts#L49)

Return type for the `useImageSegmentation` hook.
Manages the state and operations for Computer Vision image segmentation (e.g., DeepLab).

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:68](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/imageSegmentation.ts#L68)

Represents the download progress of the model binary as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:53](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/imageSegmentation.ts#L53)

Contains the error object if the model failed to load, download, or encountered a runtime error during segmentation.

***

### forward()

> **forward**: (`imageSource`, `classesOfInterest?`, `resize?`) => `Promise`\<`Partial`\<`Record`\<[`DeeplabLabel`](../enumerations/DeeplabLabel.md), `number`[]\>\>\>

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:78](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/imageSegmentation.ts#L78)

Executes the model's forward pass to perform semantic segmentation on the provided image.

#### Parameters

##### imageSource

`string`

A string representing the image source (e.g., a file path, URI, or base64 string) to be processed.

##### classesOfInterest?

[`DeeplabLabel`](../enumerations/DeeplabLabel.md)[]

An optional array of `DeeplabLabel` enums. If provided, the model will only return segmentation masks for these specific classes.

##### resize?

`boolean`

An optional boolean indicating whether the output segmentation masks should be resized to match the original image dimensions. Defaults to standard model behavior if undefined.

#### Returns

`Promise`\<`Partial`\<`Record`\<[`DeeplabLabel`](../enumerations/DeeplabLabel.md), `number`[]\>\>\>

A Promise that resolves to an object mapping each detected `DeeplabLabel` to its corresponding segmentation mask (represented as a flattened array of numbers).

#### Throws

If the model is not loaded or is currently processing another image.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:63](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/imageSegmentation.ts#L63)

Indicates whether the model is currently processing an image.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:58](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/imageSegmentation.ts#L58)

Indicates whether the segmentation model is loaded and ready to process images.
