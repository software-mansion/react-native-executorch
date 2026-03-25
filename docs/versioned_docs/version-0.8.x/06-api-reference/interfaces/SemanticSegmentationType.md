# Interface: SemanticSegmentationType\<L\>

Defined in: [types/semanticSegmentation.ts:117](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/semanticSegmentation.ts#L117)

Return type for the `useSemanticSegmentation` hook.
Manages the state and operations for semantic segmentation models.

## Type Parameters

### L

`L` *extends* [`LabelEnum`](../type-aliases/LabelEnum.md)

The [LabelEnum](../type-aliases/LabelEnum.md) representing the model's class labels.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/semanticSegmentation.ts:136](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/semanticSegmentation.ts#L136)

Represents the download progress of the model binary as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/semanticSegmentation.ts:121](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/semanticSegmentation.ts#L121)

Contains the error object if the model failed to load, download, or encountered a runtime error during segmentation.

***

### forward()

> **forward**: \<`K`\>(`input`, `classesOfInterest?`, `resizeToInput?`) => `Promise`\<`Record`\<`"ARGMAX"`, `Int32Array`\<`ArrayBufferLike`\>\> & `Record`\<`K`, `Float32Array`\<`ArrayBufferLike`\>\>\>

Defined in: [types/semanticSegmentation.ts:152](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/semanticSegmentation.ts#L152)

Executes the model's forward pass to perform semantic segmentation on the provided image.

Supports two input types:
1. **String path/URI**: File path, URL, or Base64-encoded string
2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)

**Note**: For VisionCamera frame processing, use `runOnFrame` instead.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### input

Image source (string or PixelData object)

`string` | [`PixelData`](PixelData.md)

##### classesOfInterest?

`K`[]

An optional array of label keys indicating which per-class probability masks to include in the output. `ARGMAX` is always returned regardless.

##### resizeToInput?

`boolean`

Whether to resize the output masks to the original input image dimensions. If `false`, returns the raw model output dimensions. Defaults to `true`.

#### Returns

`Promise`\<`Record`\<`"ARGMAX"`, `Int32Array`\<`ArrayBufferLike`\>\> & `Record`\<`K`, `Float32Array`\<`ArrayBufferLike`\>\>\>

A Promise resolving to an object with an `'ARGMAX'` `Int32Array` of per-pixel class indices, and each requested class label mapped to a `Float32Array` of per-pixel probabilities.

#### Throws

If the model is not loaded or is currently processing another image.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/semanticSegmentation.ts:131](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/semanticSegmentation.ts#L131)

Indicates whether the model is currently processing an image.

***

### isReady

> **isReady**: `boolean`

Defined in: [types/semanticSegmentation.ts:126](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/semanticSegmentation.ts#L126)

Indicates whether the segmentation model is loaded and ready to process images.

***

### runOnFrame

> **runOnFrame**: (`frame`, `isFrontCamera`, `classesOfInterest?`, `resizeToInput?`) => `Record`\<`"ARGMAX"`, `Int32Array`\<`ArrayBufferLike`\>\> & `Record`\<`string`, `Float32Array`\<`ArrayBufferLike`\>\> \| `null`

Defined in: [types/semanticSegmentation.ts:172](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/semanticSegmentation.ts#L172)

Synchronous worklet function for real-time VisionCamera frame processing.
Automatically handles native buffer extraction and cleanup.

**Use this for VisionCamera frame processing in worklets.**
For async processing, use `forward()` instead.

Available after model is loaded (`isReady: true`).

#### Param

VisionCamera Frame object

#### Param

Whether the front camera is active, used for mirroring corrections.

#### Param

Labels for which to return per-class probability masks.

#### Param

Whether to resize masks to original frame dimensions. Defaults to `true`.

#### Returns

Object with `ARGMAX` Int32Array and per-class Float32Array masks.
