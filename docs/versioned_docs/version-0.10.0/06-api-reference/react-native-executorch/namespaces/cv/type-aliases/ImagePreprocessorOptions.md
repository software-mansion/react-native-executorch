# Type Alias: ImagePreprocessorOptions

> **ImagePreprocessorOptions** = `object`

Defined in: [extensions/cv/utils/imagePreprocessor.ts:25](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/utils/imagePreprocessor.ts#L25)

Options for configuring the image preprocessor pipeline.

## Properties

### interpolation

> `readonly` **interpolation**: [`InterpolationMethod`](InterpolationMethod.md)

Defined in: [extensions/cv/utils/imagePreprocessor.ts:29](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/utils/imagePreprocessor.ts#L29)

Algorithm used when resizing (e.g. `'linear'`, `'lanczos'`).

---

### normalizeOpts

> `readonly` **normalizeOpts**: [`NormalizeOptions`](NormalizeOptions.md)

Defined in: [extensions/cv/utils/imagePreprocessor.ts:31](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/utils/imagePreprocessor.ts#L31)

Normalization scaling coefficients.

---

### padValue?

> `readonly` `optional` **padValue**: `number`

Defined in: [extensions/cv/utils/imagePreprocessor.ts:33](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/utils/imagePreprocessor.ts#L33)

Optional background fill value used when letterboxing (padding).

---

### resizeMode

> `readonly` **resizeMode**: [`ResizeMode`](ResizeMode.md)

Defined in: [extensions/cv/utils/imagePreprocessor.ts:27](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/utils/imagePreprocessor.ts#L27)

How the input image is resized to match the model's expected dimensions.
