# Interface: OCRType

Defined in: [types/ocr.ts:79](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/ocr.ts#L79)

Return type for the `useOCR` hook.
Manages the state and operations for Optical Character Recognition (OCR).

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/ocr.ts:98](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/ocr.ts#L98)

Represents the total download progress of the model binaries as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/ocr.ts:83](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/ocr.ts#L83)

Contains the error object if the models failed to load, download, or encountered a runtime error during recognition.

---

### forward()

> **forward**: (`imageSource`) => `Promise`\<[`OCRDetection`](OCRDetection.md)[]\>

Defined in: [types/ocr.ts:106](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/ocr.ts#L106)

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

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/ocr.ts:93](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/ocr.ts#L93)

Indicates whether the model is currently processing an image.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/ocr.ts:88](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/ocr.ts#L88)

Indicates whether both detector and recognizer models are loaded and ready to process images.
