# Interface: ClassificationType\<L\>

Defined in: [types/classification.ts:53](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/classification.ts#L53)

Return type for the `useClassification` hook.
Manages the state and operations for Computer Vision image classification.

## Type Parameters

### L

`L` *extends* [`LabelEnum`](../type-aliases/LabelEnum.md)

The [LabelEnum](../type-aliases/LabelEnum.md) representing the model's class labels.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/classification.ts:72](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/classification.ts#L72)

Represents the download progress of the model binary as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/classification.ts:57](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/classification.ts#L57)

Contains the error object if the model failed to load, download, or encountered a runtime error during classification.

***

### forward()

> **forward**: (`input`) => `Promise`\<`Record`\<keyof `L`, `number`\>\>

Defined in: [types/classification.ts:86](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/classification.ts#L86)

Executes the model's forward pass to classify the provided image.

Supports two input types:
1. **String path/URI**: File path, URL, or Base64-encoded string
2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)

**Note**: For VisionCamera frame processing, use `runOnFrame` instead.

#### Parameters

##### input

Image source (string or PixelData object)

`string` | [`PixelData`](PixelData.md)

#### Returns

`Promise`\<`Record`\<keyof `L`, `number`\>\>

A Promise that resolves to the classification result mapping label keys to confidence scores.

#### Throws

If the model is not loaded or is currently processing another image.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/classification.ts:67](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/classification.ts#L67)

Indicates whether the model is currently processing an image.

***

### isReady

> **isReady**: `boolean`

Defined in: [types/classification.ts:62](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/classification.ts#L62)

Indicates whether the classification model is loaded and ready to process images.

***

### runOnFrame

> **runOnFrame**: (`frame`) => `Record`\<keyof `L`, `number`\> \| `null`

Defined in: [types/classification.ts:99](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/classification.ts#L99)

Synchronous worklet function for real-time VisionCamera frame processing.
Automatically handles native buffer extraction and cleanup.

**Use this for VisionCamera frame processing in worklets.**
For async processing, use `forward()` instead.

Available after model is loaded (`isReady: true`).

#### Param

VisionCamera Frame object

#### Returns

Object mapping class labels to confidence scores.
