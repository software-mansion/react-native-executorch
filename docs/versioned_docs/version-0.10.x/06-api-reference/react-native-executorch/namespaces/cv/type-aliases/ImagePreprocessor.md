# Type Alias: ImagePreprocessor

> **ImagePreprocessor** = `object`

Defined in: [extensions/cv/utils/imagePreprocessor.ts:40](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/utils/imagePreprocessor.ts#L40)

Image preprocessor runner for transforming image buffers into model input tensors.

## Properties

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/cv/utils/imagePreprocessor.ts:44](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/utils/imagePreprocessor.ts#L44)

Releases all allocated native resources.

#### Returns

`void`

---

### process()

> `readonly` **process**: (`input`) => [`Tensor`](../../../../type-aliases/Tensor.md)

Defined in: [extensions/cv/utils/imagePreprocessor.ts:57](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/utils/imagePreprocessor.ts#L57)

Preprocesses the input image by resizing, converting color space, changing
format layout, and normalizing values, copying the output directly to the
pre-allocated output tensor.

Note: The returned tensor is managed by the preprocessor; consumers do not
need to dispose of it manually.

#### Parameters

##### input

[`ImageBuffer`](ImageBuffer.md)

The input image buffer to preprocess.

#### Returns

[`Tensor`](../../../../type-aliases/Tensor.md)

A reference to the output tensor containing preprocessed float32
data of shape `[3, H, W]` (or `[1, 3, H, W]`) and data type `float32`.
