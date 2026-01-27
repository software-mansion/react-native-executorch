# Interface: OCRType

Defined in: [packages/react-native-executorch/src/types/ocr.ts:76](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/ocr.ts#L76)

Return type for the `useOCR` hook.
Manages the state and operations for Optical Character Recognition (OCR).

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/ocr.ts:95](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/ocr.ts#L95)

Represents the total download progress of the model binaries as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/ocr.ts:80](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/ocr.ts#L80)

Contains the error object if the models failed to load, download, or encountered a runtime error during recognition.

***

### forward()

> **forward**: (`imageSource`) => `Promise`\<[`OCRDetection`](OCRDetection.md)[]\>

Defined in: [packages/react-native-executorch/src/types/ocr.ts:103](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/ocr.ts#L103)

Executes the OCR pipeline (detection and recognition) on the provided image.

#### Parameters

##### imageSource

`string`

A string representing the image source (e.g., a file path, URI, or base64 string) to be processed.

#### Returns

`Promise`\<[`OCRDetection`](OCRDetection.md)[]\>

A Promise that resolves to the OCR results (typically containing the recognized text strings and their bounding boxes).

#### Throws

If the models are not loaded or are currently processing another image.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/ocr.ts:90](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/ocr.ts#L90)

Indicates whether the model is currently processing an image.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/ocr.ts:85](https://github.com/software-mansion/react-native-executorch/blob/378038b2ca252093c86e64cbbe998c6201d1ff7a/packages/react-native-executorch/src/types/ocr.ts#L85)

Indicates whether both detector and recognizer models are loaded and ready to process images.
