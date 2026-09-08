# Type Alias: KeypointDetector\<F, L\>

> **KeypointDetector**\<`F`, `L`\> = `object`

Defined in: [extensions/cv/tasks/keypointDetection.ts:104](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L104)

Keypoint and pose detection task runner.

## Type Parameters

### F

`F` _extends_ [`BoxFormat`](../react-native-executorch/namespaces/cv/type-aliases/BoxFormat.md)

The bounding box format.

### L

`L` _extends_ `PropertyKey`

The landmark labels type.

## Properties

### detectKeypoints()

> `readonly` **detectKeypoints**: (`input`, `options?`) => `Promise`\<[`KeypointDetection`](KeypointDetection.md)\<`F`, `L`\>[]\>

Defined in: [extensions/cv/tasks/keypointDetection.ts:120](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L120)

Performs asynchronous keypoint and bounding box detection on the given
input image.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

The input image buffer.

##### options?

[`DetectKeypointsOptions`](DetectKeypointsOptions.md)

Configuration options for keypoint detection.
See [DetectKeypointsOptions](DetectKeypointsOptions.md).

#### Returns

`Promise`\<[`KeypointDetection`](KeypointDetection.md)\<`F`, `L`\>[]\>

A promise resolving to the list of keypoint detections.

#### Throws

With code `RESOURCE_BUSY` if the model is in
use, or `RESOURCE_DISPOSED` if disposed.

---

### detectKeypointsWorklet()

> `readonly` **detectKeypointsWorklet**: (`input`, `options?`) => [`KeypointDetection`](KeypointDetection.md)\<`F`, `L`\>[]

Defined in: [extensions/cv/tasks/keypointDetection.ts:129](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L129)

Synchronous version of [detectKeypoints](#detectkeypoints) to be executed directly on
the caller or worklet thread.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

##### options?

[`DetectKeypointsOptions`](DetectKeypointsOptions.md)

#### Returns

[`KeypointDetection`](KeypointDetection.md)\<`F`, `L`\>[]

---

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/cv/tasks/keypointDetection.ts:108](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L108)

Releases all allocated native resources.

#### Returns

`void`
