# Interface: InstanceSegmentationType\<L\>

Defined in: [types/instanceSegmentation.ts:153](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L153)

Return type for the `useInstanceSegmentation` hook.
Manages the state and operations for instance segmentation models.

## Type Parameters

### L

`L` *extends* [`LabelEnum`](../type-aliases/LabelEnum.md)

The label map type for the model, must conform to [LabelEnum](../type-aliases/LabelEnum.md).

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/instanceSegmentation.ts:172](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L172)

Represents the download progress of the model binary as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/instanceSegmentation.ts:157](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L157)

Contains the error object if the model failed to load, download, or encountered a runtime error during segmentation.

***

### forward()

> **forward**: (`imageSource`, `options?`) => `Promise`\<[`SegmentedInstance`](SegmentedInstance.md)\<`L`\>[]\>

Defined in: [types/instanceSegmentation.ts:181](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L181)

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

***

### getAvailableInputSizes()

> **getAvailableInputSizes**: () => readonly `number`[] \| `undefined`

Defined in: [types/instanceSegmentation.ts:190](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L190)

Returns the available input sizes for this model, or undefined if the model accepts single forward input size.

#### Returns

readonly `number`[] \| `undefined`

An array of available input sizes, or undefined if not constrained.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/instanceSegmentation.ts:167](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L167)

Indicates whether the model is currently processing an image.

***

### isReady

> **isReady**: `boolean`

Defined in: [types/instanceSegmentation.ts:162](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L162)

Indicates whether the instance segmentation model is loaded and ready to process images.

***

### runOnFrame

> **runOnFrame**: (`frame`, `isFrontCamera`, `options?`) => [`SegmentedInstance`](SegmentedInstance.md)\<`L`\>[] \| `null`

Defined in: [types/instanceSegmentation.ts:207](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/instanceSegmentation.ts#L207)

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
