# Interface: ObjectDetectionType\<L\>

Defined in: [types/objectDetection.ts:85](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L85)

Return type for the `useObjectDetection` hook.
Manages the state and operations for Computer Vision object detection tasks.

## Type Parameters

### L

`L` _extends_ [`LabelEnum`](../type-aliases/LabelEnum.md)

The [LabelEnum](../type-aliases/LabelEnum.md) representing the model's class labels.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/objectDetection.ts:104](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L104)

Represents the download progress of the model binary as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/objectDetection.ts:89](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L89)

Contains the error object if the model failed to load, download, or encountered a runtime error during detection.

---

### forward()

> **forward**: (`input`, `detectionThreshold?`) => `Promise`\<[`Detection`](Detection.md)\<`L`\>[]\>

Defined in: [types/objectDetection.ts:114](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L114)

Executes the model's forward pass with automatic input type detection.

#### Parameters

##### input

Image source (string path/URI or PixelData object)

`string` | [`PixelData`](PixelData.md)

##### detectionThreshold?

`number`

An optional number between 0 and 1 representing the minimum confidence score. Default is 0.7.

#### Returns

`Promise`\<[`Detection`](Detection.md)\<`L`\>[]\>

A Promise that resolves to an array of `Detection` objects.

#### Throws

If the model is not loaded or is currently processing another image.

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/objectDetection.ts:99](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L99)

Indicates whether the model is currently processing an image.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/objectDetection.ts:94](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L94)

Indicates whether the object detection model is loaded and ready to process images.

---

### runOnFrame

> **runOnFrame**: (`frame`, `detectionThreshold`) => [`Detection`](Detection.md)\<`L`\>[] \| `null`

Defined in: [types/objectDetection.ts:132](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L132)

Synchronous worklet function for real-time VisionCamera frame processing.
Automatically handles native buffer extraction and cleanup.

**Use this for VisionCamera frame processing in worklets.**
For async processing, use `forward()` instead.

Available after model is loaded (`isReady: true`).

#### Param

VisionCamera Frame object

#### Param

The threshold for detection sensitivity.

#### Returns

Array of Detection objects representing detected items in the frame.
