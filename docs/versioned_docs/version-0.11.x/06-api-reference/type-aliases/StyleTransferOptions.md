# Type Alias: StyleTransferOptions

> **StyleTransferOptions** = `Omit`\<[`ImagePreprocessorOptions`](../react-native-executorch/namespaces/cv/type-aliases/ImagePreprocessorOptions.md), `"resizeMode"`\> & `object`

Defined in: [extensions/cv/tasks/styleTransfer.ts:29](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/styleTransfer.ts#L29)

Options for configuring the style transfer preprocessor and postprocessor.

## Type Declaration

### outInterpolation

> `readonly` **outInterpolation**: [`InterpolationMethod`](../react-native-executorch/namespaces/cv/type-aliases/InterpolationMethod.md)

Interpolation method used when resizing output styled images to input dimensions.

### outNormalizeOpts

> `readonly` **outNormalizeOpts**: [`NormalizeOptions`](../react-native-executorch/namespaces/cv/type-aliases/NormalizeOptions.md)

Normalization options for postprocessing output tensors back to uint8 pixel values.

### resizeMode

> `readonly` **resizeMode**: `"stretch"`

Resize mode for input images. Must be `'stretch'`.
