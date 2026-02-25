# Interface: ObjectDetectionType\<L\>

Defined in: [types/objectDetection.ts:84](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L84)

Return type for the `useObjectDetection` hook.
Manages the state and operations for Computer Vision object detection tasks.

## Type Parameters

### L

`L` _extends_ [`LabelEnum`](../type-aliases/LabelEnum.md)

The [LabelEnum](../type-aliases/LabelEnum.md) representing the model's class labels.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/objectDetection.ts:103](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L103)

Represents the download progress of the model binary as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/objectDetection.ts:88](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L88)

Contains the error object if the model failed to load, download, or encountered a runtime error during detection.

---

### forward()

> **forward**: (`imageSource`, `detectionThreshold?`) => `Promise`\<[`Detection`](Detection.md)\<`L`\>[]\>

Defined in: [types/objectDetection.ts:112](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L112)

Executes the model's forward pass to detect objects within the provided image.

#### Parameters

##### imageSource

`string`

A string representing the image source (e.g., a file path, URI, or base64 string) to be processed.

##### detectionThreshold?

`number`

An optional number between 0 and 1 representing the minimum confidence score required for an object to be included in the results. Default is 0.7.

#### Returns

`Promise`\<[`Detection`](Detection.md)\<`L`\>[]\>

A Promise that resolves to an array of `Detection` objects, where each object typically contains bounding box coordinates, a class label, and a confidence score.

#### Throws

If the model is not loaded or is currently processing another image.

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/objectDetection.ts:98](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L98)

Indicates whether the model is currently processing an image.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/objectDetection.ts:93](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/objectDetection.ts#L93)

Indicates whether the object detection model is loaded and ready to process images.
