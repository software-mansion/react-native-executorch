# Interface: ImageSegmentationType

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:55](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/imageSegmentation.ts#L55)

Return type for the `useImageSegmentation` hook.
Manages the state and operations for Computer Vision image segmentation (e.g., DeepLab).

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:74](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/imageSegmentation.ts#L74)

Represents the download progress of the model binary as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:59](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/imageSegmentation.ts#L59)

Contains the error object if the model failed to load, download, or encountered a runtime error during segmentation.

***

### forward()

> **forward**: (`imageSource`, `classesOfInterest?`, `resize?`) => `Promise`\<`Partial`\<`Record`\<[`DeeplabLabel`](../enumerations/DeeplabLabel.md), `number`[]\>\>\>

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:84](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/imageSegmentation.ts#L84)

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

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:69](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/imageSegmentation.ts#L69)

Indicates whether the model is currently processing an image.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:64](https://github.com/software-mansion/react-native-executorch/blob/648d3b10102df620ad27372c8991aec047665199/packages/react-native-executorch/src/types/imageSegmentation.ts#L64)

Indicates whether the segmentation model is loaded and ready to process images.
