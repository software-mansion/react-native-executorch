# Type Alias: ObjectDetector\<F, L\>

> **ObjectDetector**\<`F`, `L`\> = `object`

Defined in: [extensions/cv/tasks/objectDetection.ts:92](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts#L92)

Object detection task runner.

## Type Parameters

### F

`F` _extends_ [`BoxFormat`](../react-native-executorch/namespaces/cv/type-aliases/BoxFormat.md)

The bounding box format.

### L

`L`

The type representing the class labels.

## Properties

### detectObjects()

> `readonly` **detectObjects**: (`input`, `options?`) => `Promise`\<[`ObjectDetection`](ObjectDetection.md)\<`F`, `L`\>[]\>

Defined in: [extensions/cv/tasks/objectDetection.ts:108](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts#L108)

Asynchronously performs object detection on the input image.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

The input image buffer.

##### options?

[`DetectObjectsOptions`](DetectObjectsOptions.md)

Configuration options for object detection.
See [DetectObjectsOptions](DetectObjectsOptions.md).

#### Returns

`Promise`\<[`ObjectDetection`](ObjectDetection.md)\<`F`, `L`\>[]\>

A promise resolving to the list of object detections.

#### Throws

With code `INVALID_ARGUMENT` if predicted class
index is out of bounds, `RESOURCE_BUSY` if the model is in use, or
`RESOURCE_DISPOSED` if disposed.

---

### detectObjectsWorklet()

> `readonly` **detectObjectsWorklet**: (`input`, `options?`) => [`ObjectDetection`](ObjectDetection.md)\<`F`, `L`\>[]

Defined in: [extensions/cv/tasks/objectDetection.ts:117](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts#L117)

Synchronous version of [detectObjects](#detectobjects) to be executed directly on the
caller or worklet thread.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

##### options?

[`DetectObjectsOptions`](DetectObjectsOptions.md)

#### Returns

[`ObjectDetection`](ObjectDetection.md)\<`F`, `L`\>[]

---

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/cv/tasks/objectDetection.ts:96](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts#L96)

Releases all allocated native resources.

#### Returns

`void`
