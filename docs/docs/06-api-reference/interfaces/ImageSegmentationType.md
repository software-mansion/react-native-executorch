# Interface: ImageSegmentationType\<L\>

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:107](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/imageSegmentation.ts#L107)

Return type for the `useImageSegmentation` hook.
Manages the state and operations for image segmentation models.

## Type Parameters

### L

`L` _extends_ [`LabelEnum`](../type-aliases/LabelEnum.md)

The [LabelEnum](../type-aliases/LabelEnum.md) representing the model's class labels.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:126](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/imageSegmentation.ts#L126)

Represents the download progress of the model binary as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:111](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/imageSegmentation.ts#L111)

Contains the error object if the model failed to load, download, or encountered a runtime error during segmentation.

---

### forward()

> **forward**: \<`K`\>(`imageSource`, `classesOfInterest?`, `resizeToInput?`) => `Promise`\<`Record`\<`"ARGMAX"`, `Int32Array`\<`ArrayBufferLike`\>\> & `Record`\<`K`, `Float32Array`\<`ArrayBufferLike`\>\>\>

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:136](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/imageSegmentation.ts#L136)

Executes the model's forward pass to perform semantic segmentation on the provided image.

#### Type Parameters

##### K

`K` _extends_ `string` \| `number` \| `symbol`

#### Parameters

##### imageSource

`string`

A string representing the image source (e.g., a file path, URI, or base64 string) to be processed.

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

---

### isGenerating

> **isGenerating**: `boolean`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:121](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/imageSegmentation.ts#L121)

Indicates whether the model is currently processing an image.

---

### isReady

> **isReady**: `boolean`

Defined in: [packages/react-native-executorch/src/types/imageSegmentation.ts:116](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/imageSegmentation.ts#L116)

Indicates whether the segmentation model is loaded and ready to process images.
