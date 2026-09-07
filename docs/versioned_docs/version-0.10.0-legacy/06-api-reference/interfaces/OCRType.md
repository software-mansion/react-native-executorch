# Interface: OCRType

Defined in: [types/ocr.ts:75](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/ocr.ts#L75)

Return type for the `useOCR` hook.
Manages the state and operations for Optical Character Recognition (OCR).

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/ocr.ts:94](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/ocr.ts#L94)

Represents the total download progress of the model binaries as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/ocr.ts:79](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/ocr.ts#L79)

Contains the error object if the models failed to load, download, or encountered a runtime error during recognition.

---

### forward()

> **forward**: (`input`) => `Promise`\<[`OCRDetection`](OCRDetection.md)[]\>

Defined in: [types/ocr.ts:108](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/ocr.ts#L108)

Executes the OCR pipeline (detection and recognition) on the provided image.

Supports two input types:

1. **String path/URI**: File path, URL, or Base64-encoded string
2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)

**Note**: For VisionCamera frame processing, use `runOnFrame` instead.

#### Parameters

##### input

Image source (string or PixelData object)

`string` | [`PixelData`](PixelData.md)

#### Returns

`Promise`\<[`OCRDetection`](OCRDetection.md)[]\>

A Promise that resolves to the OCR results (recognized text and bounding boxes).

#### Throws

If the models are not loaded or are currently processing another image.

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/ocr.ts:89](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/ocr.ts#L89)

Indicates whether the model is currently processing an image.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/ocr.ts:84](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/ocr.ts#L84)

Indicates whether both detector and recognizer models are loaded and ready to process images.

---

### runOnFrame

> **runOnFrame**: (`frame`, `isFrontCamera`) => [`OCRDetection`](OCRDetection.md)[] \| `null`

Defined in: [types/ocr.ts:125](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/ocr.ts#L125)

Synchronous worklet function for VisionCamera frame processing.
Automatically handles native buffer extraction and cleanup.

**Use this for VisionCamera frame processing in worklets.**
For async processing, use `forward()` instead.

**Note**: OCR is a two-stage pipeline (detection + recognition) and may not
achieve real-time frame rates. Frames may be dropped if inference is still running.

Available after model is loaded (`isReady: true`).

#### Param

VisionCamera Frame object

#### Param

Whether the front camera is active, used for mirroring corrections.

#### Returns

Array of OCRDetection results for the frame.
