# Interface: StyleTransferType

Defined in: [types/styleTransfer.ts:35](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/styleTransfer.ts#L35)

Return type for the `useStyleTransfer` hook.
Manages the state and operations for applying artistic style transfer to images.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/styleTransfer.ts:54](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/styleTransfer.ts#L54)

Represents the download progress of the model binary as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/styleTransfer.ts:39](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/styleTransfer.ts#L39)

Contains the error object if the model failed to load, download, or encountered a runtime error during style transfer.

---

### forward()

> **forward**: (`imageSource`) => `Promise`\<`string`\>

Defined in: [types/styleTransfer.ts:62](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/styleTransfer.ts#L62)

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

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [types/styleTransfer.ts:49](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/styleTransfer.ts#L49)

Indicates whether the model is currently processing an image.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/styleTransfer.ts:44](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/styleTransfer.ts#L44)

Indicates whether the style transfer model is loaded and ready to process images.
