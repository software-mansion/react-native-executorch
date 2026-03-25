# Interface: StyleTransferType

Defined in: [types/styleTransfer.ts:36](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/styleTransfer.ts#L36)

Return type for the `useStyleTransfer` hook.
Manages the state and operations for applying artistic style transfer to images.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/styleTransfer.ts:55](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/styleTransfer.ts#L55)

Represents the download progress of the model binary as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/styleTransfer.ts:40](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/styleTransfer.ts#L40)

Contains the error object if the model failed to load, download, or encountered a runtime error during style transfer.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/styleTransfer.ts:50](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/styleTransfer.ts#L50)

Indicates whether the model is currently processing an image.

***

### isReady

> **isReady**: `boolean`

Defined in: [types/styleTransfer.ts:45](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/styleTransfer.ts#L45)

Indicates whether the style transfer model is loaded and ready to process images.

***

### runOnFrame

> **runOnFrame**: (`frame`, `isFrontCamera`) => [`PixelData`](PixelData.md) \| `null`

Defined in: [types/styleTransfer.ts:87](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/styleTransfer.ts#L87)

Synchronous worklet function for real-time VisionCamera frame processing.
Automatically handles native buffer extraction and cleanup.

**Use this for VisionCamera frame processing in worklets.**
For async processing, use `forward()` instead.

Available after model is loaded (`isReady: true`).

#### Param

VisionCamera Frame object

#### Param

Whether the front camera is active, used for mirroring corrections.

#### Returns

PixelData containing the stylized frame as raw RGB pixel data.

## Methods

### forward()

> **forward**\<`O`\>(`input`, `outputType?`): `Promise`\<`O` *extends* `"url"` ? `string` : [`PixelData`](PixelData.md)\>

Defined in: [types/styleTransfer.ts:70](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/styleTransfer.ts#L70)

Executes the model's forward pass to apply the specific artistic style to the provided image.

Supports two input types:
1. **String path/URI**: File path, URL, or Base64-encoded string
2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)

**Note**: For VisionCamera frame processing, use `runOnFrame` instead.

#### Type Parameters

##### O

`O` *extends* `"pixelData"` \| `"url"` = `"pixelData"`

#### Parameters

##### input

Image source (string or PixelData object)

`string` | [`PixelData`](PixelData.md)

##### outputType?

`O`

Output format: `'pixelData'` (default) returns raw RGBA pixel data; `'url'` saves the result to a temp file and returns its `file://` path.

#### Returns

`Promise`\<`O` *extends* `"url"` ? `string` : [`PixelData`](PixelData.md)\>

A Promise resolving to `PixelData` when `outputType` is `'pixelData'` (default), or a `file://` URL string when `outputType` is `'url'`.

#### Throws

If the model is not loaded or is currently processing another image.
