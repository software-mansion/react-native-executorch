# Function: createImagePreprocessor()

> **createImagePreprocessor**(`options`, `outputShape`): [`ImagePreprocessor`](../type-aliases/ImagePreprocessor.md)

Defined in: [extensions/cv/utils/imagePreprocessor.ts:77](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/utils/imagePreprocessor.ts#L77)

Creates a reusable image preprocessor pipeline.

Configures a pipeline to resize, color convert, convert layout (HWC to CHW),
normalize, and copy raw image buffers into target tensors matching model
input shapes. All intermediate scratch tensors are pre-allocated and safely
disposed of when calling `dispose()`.

## Parameters

### options

[`ImagePreprocessorOptions`](../type-aliases/ImagePreprocessorOptions.md)

Normalization scaling coefficients, interpolation algorithms, and
resize modes.
See [ImagePreprocessorOptions](../type-aliases/ImagePreprocessorOptions.md).

### outputShape

`number`[]

Expected output shape of the preprocessed model input
tensor (must match rank-3 `[3, H, W]` or rank-4 `[1, 3, H, W]`).

## Returns

[`ImagePreprocessor`](../type-aliases/ImagePreprocessor.md)

An instantiated [ImagePreprocessor](../type-aliases/ImagePreprocessor.md) pipeline.

## Throws

With code `SCHEMA_MISMATCH` if `outputShape` does
not match rank-3 `[3, H, W]` or rank-4 `[1, 3, H, W]`.
