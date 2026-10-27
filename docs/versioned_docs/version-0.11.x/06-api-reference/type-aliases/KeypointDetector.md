# Type Alias: KeypointDetector\<F, L\>

> **KeypointDetector**\<`F`, `L`\> = `object`

Defined in: [extensions/cv/tasks/keypointDetection.ts:121](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L121)

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

Defined in: [extensions/cv/tasks/keypointDetection.ts:137](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L137)

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

Defined in: [extensions/cv/tasks/keypointDetection.ts:146](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L146)

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

Defined in: [extensions/cv/tasks/keypointDetection.ts:125](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L125)

Releases all allocated native resources.

#### Returns

`void`
