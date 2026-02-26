# Interface: SemanticSegmentationType\<L\>

Defined in: [types/semanticSegmentation.ts:118](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/semanticSegmentation.ts#L118)

Return type for the `useSemanticSegmentation` hook.
Manages the state and operations for semantic segmentation models.

## Type Parameters

### L

`L` _extends_ [`LabelEnum`](../type-aliases/LabelEnum.md)

The [LabelEnum](../type-aliases/LabelEnum.md) representing the model's class labels.

## Properties

### downloadProgress

> **downloadProgress**: `number`

Defined in: [types/semanticSegmentation.ts:137](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/semanticSegmentation.ts#L137)

Represents the download progress of the model binary as a value between 0 and 1.

---

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Defined in: [types/semanticSegmentation.ts:122](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/semanticSegmentation.ts#L122)

Contains the error object if the model failed to load, download, or encountered a runtime error during segmentation.

---

### forward()

> **forward**: \<`K`\>(`imageSource`, `classesOfInterest?`, `resizeToInput?`) => `Promise`\<`Record`\<`"ARGMAX"`, `Int32Array`\<`ArrayBufferLike`\>\> & `Record`\<`K`, `Float32Array`\<`ArrayBufferLike`\>\>\>

Defined in: [types/semanticSegmentation.ts:147](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/semanticSegmentation.ts#L147)

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

Defined in: [types/semanticSegmentation.ts:132](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/semanticSegmentation.ts#L132)

Indicates whether the model is currently processing an image.

---

### isReady

> **isReady**: `boolean`

Defined in: [types/semanticSegmentation.ts:127](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/types/semanticSegmentation.ts#L127)

Indicates whether the segmentation model is loaded and ready to process images.
