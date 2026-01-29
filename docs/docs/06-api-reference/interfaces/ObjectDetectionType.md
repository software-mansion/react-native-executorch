# Interface: ObjectDetectionType

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:151](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/objectDetection.ts#L151)

Return type for the `useObjectDetection` hook.
Manages the state and operations for Computer Vision object detection tasks.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:170](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/objectDetection.ts#L170)

Represents the download progress of the model binary as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:155](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/objectDetection.ts#L155)

Contains the error object if the model failed to load, download, or encountered a runtime error during detection.

***

### forward()

> **forward**: (`imageSource`, `detectionThreshold?`) => `Promise`\<[`Detection`](Detection.md)[]\>

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:179](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/objectDetection.ts#L179)

Executes the model's forward pass to detect objects within the provided image.

#### Parameters

##### imageSource

`string`

A string representing the image source (e.g., a file path, URI, or base64 string) to be processed.

##### detectionThreshold?

`number`

An optional number between 0 and 1 representing the minimum confidence score required for an object to be included in the results. Dafault is 0.7.

#### Returns

`Promise`\<[`Detection`](Detection.md)[]\>

A Promise that resolves to an array of `Detection` objects, where each object typically contains bounding box coordinates, a class label, and a confidence score.

#### Throws

If the model is not loaded or is currently processing another image.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:165](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/objectDetection.ts#L165)

Indicates whether the model is currently processing an image.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:160](https://github.com/software-mansion/react-native-executorch/blob/7d713f1325a78449d56d2e9931c3ba580ce67027/packages/react-native-executorch/src/types/objectDetection.ts#L160)

Indicates whether the object detection model is loaded and ready to process images.
