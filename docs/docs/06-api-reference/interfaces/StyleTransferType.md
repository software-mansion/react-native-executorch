# Interface: StyleTransferType

Defined in: [packages/react-native-executorch/src/types/styleTransfer.ts:20](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/types/styleTransfer.ts#L20)

Return type for the `useStyleTransfer` hook.
Manages the state and operations for applying artistic style transfer to images.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/styleTransfer.ts:39](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/types/styleTransfer.ts#L39)

Represents the download progress of the model binary as a value between 0 and 1.

***

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/styleTransfer.ts:24](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/types/styleTransfer.ts#L24)

Contains the error object if the model failed to load, download, or encountered a runtime error during style transfer.

***

### forward()

> **forward**: (`imageSource`) => `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/types/styleTransfer.ts:47](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/types/styleTransfer.ts#L47)

Executes the model's forward pass to apply the specific artistic style to the provided image.

#### Parameters

##### imageSource

`string`

A string representing the input image source (e.g., a file path, URI, or base64 string) to be stylized.

#### Returns

`Promise`\<`string`\>

A Promise that resolves to a string containing the stylized image (typically as a base64 string or a file URI).

#### Throws

If the model is not loaded or is currently processing another image.

***

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/styleTransfer.ts:34](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/types/styleTransfer.ts#L34)

Indicates whether the model is currently processing an image.

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/styleTransfer.ts:29](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/types/styleTransfer.ts#L29)

Indicates whether the style transfer model is loaded and ready to process images.
