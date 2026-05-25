# Interface: InstanceSegmentationType\<L\>

Defined in: [types/instanceSegmentation.ts:155](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/instanceSegmentation.ts#L155)

Return type for the `useInstanceSegmentation` hook.
Manages the state and operations for instance segmentation models.

## Type Parameters

### L

`L` _extends_ [`LabelEnum`](../type-aliases/LabelEnum.md)

The label map type for the model, must conform to [LabelEnum](../type-aliases/LabelEnum.md).

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/instanceSegmentation.ts:174](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/instanceSegmentation.ts#L174)

Represents the download progress of the model binary as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/instanceSegmentation.ts:159](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/instanceSegmentation.ts#L159)

Contains the error object if the model failed to load, download, or encountered a runtime error during segmentation.

---

### forward()

> **forward**: (`imageSource`, `options?`) => `Promise`\<[`SegmentedInstance`](SegmentedInstance.md)\<`L`\>[]\>

Defined in: [types/instanceSegmentation.ts:183](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/instanceSegmentation.ts#L183)

Executes the model's forward pass to perform instance segmentation on the provided image.

#### Parameters

##### imageSource

A string (e.g., a file path, URI ) or PixelData representing the image source to be processed.

`string` | [`PixelData`](PixelData.md)

##### options?

[`InstanceSegmentationOptions`](InstanceSegmentationOptions.md)\<`L`\>

Optional configuration for the segmentation process.

#### Returns

`Promise`\<[`SegmentedInstance`](SegmentedInstance.md)\<`L`\>[]\>

A Promise resolving to an array of [SegmentedInstance](SegmentedInstance.md) objects.

#### Throws

If the model is not loaded or is currently processing another image.

---

### getAvailableInputSizes()

> **getAvailableInputSizes**: () => readonly `number`[] \| `undefined`

Defined in: [types/instanceSegmentation.ts:192](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/instanceSegmentation.ts#L192)

Returns the available input sizes for this model, or undefined if the model accepts single forward input size.

#### Returns

readonly `number`[] \| `undefined`

An array of available input sizes, or undefined if not constrained.

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/instanceSegmentation.ts:169](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/instanceSegmentation.ts#L169)

Indicates whether the model is currently processing an image.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/instanceSegmentation.ts:164](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/instanceSegmentation.ts#L164)

Indicates whether the instance segmentation model is loaded and ready to process images.

---

### runOnFrame

> **runOnFrame**: (`frame`, `isFrontCamera`, `options?`) => [`SegmentedInstance`](SegmentedInstance.md)\<`L`\>[] \| `null`

Defined in: [types/instanceSegmentation.ts:209](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/instanceSegmentation.ts#L209)

Synchronous worklet function for real-time VisionCamera frame processing.
Automatically handles native buffer extraction and cleanup.

**Use this for VisionCamera frame processing in worklets.**
For async processing, use `forward()` instead.

`null` until the model is ready (`isReady: true`). The property itself is
`null` when the model has not loaded yet — the function always returns an
array (never `null`) once called.

#### Param

VisionCamera Frame object

#### Param

Whether the front camera is active (for mirroring correction).

#### Param

Optional configuration for the segmentation process.

#### Returns

Array of SegmentedInstance objects representing detected items in the frame.
