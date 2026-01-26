# Interface: ObjectDetectionType

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:144](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/objectDetection.ts#L144)

Return type for the `useObjectDetection` hook.
Manages the state and operations for Computer Vision object detection tasks.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:163](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/objectDetection.ts#L163)

Represents the download progress of the model binary as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:148](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/objectDetection.ts#L148)

Contains the error object if the model failed to load, download, or encountered a runtime error during detection.

***

### forward()

> **forward**: (`imageSource`, `detectionThreshold?`) => `Promise`\<[`Detection`](Detection.md)[]\>

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:172](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/objectDetection.ts#L172)

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

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:158](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/objectDetection.ts#L158)

Indicates whether the model is currently processing an image.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/objectDetection.ts:153](https://github.com/software-mansion/react-native-executorch/blob/520acc3881283b9238af4c444f8831911dadd9ed/packages/react-native-executorch/src/types/objectDetection.ts#L153)

Indicates whether the object detection model is loaded and ready to process images.
