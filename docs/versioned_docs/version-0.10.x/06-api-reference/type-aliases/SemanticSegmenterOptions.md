# Type Alias: SemanticSegmenterOptions\<L\>

> **SemanticSegmenterOptions**\<`L`\> = `Omit`\<[`ImagePreprocessorOptions`](../react-native-executorch/namespaces/cv/type-aliases/ImagePreprocessorOptions.md), `"resizeMode"`\> & `object`

Defined in: [extensions/cv/tasks/semanticSegmentation.ts:32](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/semanticSegmentation.ts#L32)

Options for configuring a semantic segmenter preprocessor and label
vocabulary.

## Type Declaration

### labels

> `readonly` **labels**: readonly `L`[]

Array of class labels matching the model's output vocabulary.

### outInterpolation

> `readonly` **outInterpolation**: [`InterpolationMethod`](../react-native-executorch/namespaces/cv/type-aliases/InterpolationMethod.md)

Interpolation method used when resizing output masks back to input image dimensions.

### resizeMode

> `readonly` **resizeMode**: `"stretch"`

Resize mode for input images. Must be `'stretch'`.

## Type Parameters

### L

`L`
