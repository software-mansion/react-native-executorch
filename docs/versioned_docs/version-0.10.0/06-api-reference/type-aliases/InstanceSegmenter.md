# Type Alias: InstanceSegmenter\<F, L\>

> **InstanceSegmenter**\<`F`, `L`\> = `object`

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:116](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L116)

Instance segmentation task runner.

## Type Parameters

### F

`F` _extends_ [`BoxFormat`](../react-native-executorch/namespaces/cv/type-aliases/BoxFormat.md)

The format type of the bounding box.

### L

`L`

The label type.

## Properties

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:120](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L120)

Releases all allocated native resources.

#### Returns

`void`

---

### segmentInstances()

> `readonly` **segmentInstances**: (`input`, `options?`) => `Promise`\<[`InstanceSegmentationResult`](InstanceSegmentationResult.md)\<`F`, `L`\>[]\>

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:132](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L132)

Performs asynchronous instance segmentation on the given input image.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

The input image buffer.

##### options?

[`SegmentInstancesOptions`](SegmentInstancesOptions.md)

Execution override options.
See [SegmentInstancesOptions](SegmentInstancesOptions.md).

#### Returns

`Promise`\<[`InstanceSegmentationResult`](InstanceSegmentationResult.md)\<`F`, `L`\>[]\>

A promise resolving to a list of detected instances.

#### Throws

With code `INVALID_ARGUMENT` if predicted class
index is out of bounds, `RESOURCE_BUSY` if the model is in use, or
`RESOURCE_DISPOSED` if disposed.

---

### segmentInstancesWorklet()

> `readonly` **segmentInstancesWorklet**: (`input`, `options?`) => [`InstanceSegmentationResult`](InstanceSegmentationResult.md)\<`F`, `L`\>[]

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:141](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L141)

Synchronous version of [segmentInstances](#segmentinstances) to be executed directly on
the caller or worklet thread.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

##### options?

[`SegmentInstancesOptions`](SegmentInstancesOptions.md)

#### Returns

[`InstanceSegmentationResult`](InstanceSegmentationResult.md)\<`F`, `L`\>[]
