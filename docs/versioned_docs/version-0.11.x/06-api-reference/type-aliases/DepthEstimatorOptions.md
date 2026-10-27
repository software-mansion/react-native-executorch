# Type Alias: DepthEstimatorOptions

> **DepthEstimatorOptions** = `Omit`\<[`ImagePreprocessorOptions`](../react-native-executorch/namespaces/cv/type-aliases/ImagePreprocessorOptions.md), `"resizeMode"` \| `"padValue"`\> & `object`

Defined in: [extensions/cv/tasks/depthEstimation.ts:38](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/depthEstimation.ts#L38)

Options for configuring a depth estimator preprocessor and output
interpolation.

## Type Declaration

### outInterpolation

> `readonly` **outInterpolation**: [`InterpolationMethod`](../react-native-executorch/namespaces/cv/type-aliases/InterpolationMethod.md)

Interpolation method used when resizing depth maps back to input image dimensions.

### resizeMode

> `readonly` **resizeMode**: `"stretch"`

Resize mode for input images. Must be `'stretch'`.
