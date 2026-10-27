# Type Alias: InpainterOptions

> **InpainterOptions** = `Omit`\<[`ImagePreprocessorOptions`](../react-native-executorch/namespaces/cv/type-aliases/ImagePreprocessorOptions.md), `"resizeMode"` \| `"padValue"`\> & `object`

Defined in: [extensions/cv/tasks/inpainting.ts:41](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/inpainting.ts#L41)

Options for configuring the inpainting preprocessor and postprocessor. The
image goes through the shared image preprocessor; the mask is always
area-resized and re-binarized, so a model pixel is part of the hole when any
of the photo pixels it covers is.

## Type Declaration

### blendOpts

> `readonly` **blendOpts**: [`BlendMaskedOptions`](../react-native-executorch/namespaces/cv/type-aliases/BlendMaskedOptions.md)

How the filled region is blended back over the original pixels. See
[BlendMaskedOptions](../react-native-executorch/namespaces/cv/type-aliases/BlendMaskedOptions.md).

### outInterpolation

> `readonly` **outInterpolation**: [`InterpolationMethod`](../react-native-executorch/namespaces/cv/type-aliases/InterpolationMethod.md)

Interpolation method used when resizing the filled frame back to input dimensions.

### outNormalizeOpts

> `readonly` **outNormalizeOpts**: [`NormalizeOptions`](../react-native-executorch/namespaces/cv/type-aliases/NormalizeOptions.md)

Normalization options for postprocessing output tensors back to uint8 pixel values.

### resizeMode

> `readonly` **resizeMode**: `"stretch"`

Resize mode for input images. Must be `'stretch'`.
