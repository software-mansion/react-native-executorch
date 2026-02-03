# Interface: StyleTransferType

Defined in: [packages/react-native-executorch/src/types/styleTransfer.ts:23](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/styleTransfer.ts#L23)

Return type for the `useStyleTransfer` hook.
Manages the state and operations for applying artistic style transfer to images.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/styleTransfer.ts:42](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/styleTransfer.ts#L42)

Represents the download progress of the model binary as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/styleTransfer.ts:27](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/styleTransfer.ts#L27)

Contains the error object if the model failed to load, download, or encountered a runtime error during style transfer.

---

### forward()

> **forward**: (`imageSource`) => `Promise`\<`string`\>

Defined in: [packages/react-native-executorch/src/types/styleTransfer.ts:50](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/styleTransfer.ts#L50)

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

Defined in: [packages/react-native-executorch/src/types/styleTransfer.ts:37](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/styleTransfer.ts#L37)

Indicates whether the model is currently processing an image.

---

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/styleTransfer.ts:32](https://github.com/software-mansion/react-native-executorch/blob/2527130c1b837827db4b034f980357f06406f7ad/packages/react-native-executorch/src/types/styleTransfer.ts#L32)

Indicates whether the style transfer model is loaded and ready to process images.
