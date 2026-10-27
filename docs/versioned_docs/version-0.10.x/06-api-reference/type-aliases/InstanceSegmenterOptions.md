# Type Alias: InstanceSegmenterOptions\<F, L\>

> **InstanceSegmenterOptions**\<`F`, `L`\> = `Omit`\<[`ImagePreprocessorOptions`](../react-native-executorch/namespaces/cv/type-aliases/ImagePreprocessorOptions.md), `"resizeMode"`\> & `object`

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:35](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L35)

Options for configuring an instance segmenter preprocessor, label
vocabulary, and threshold parameters.

## Type Declaration

### boxFormat

> `readonly` **boxFormat**: `F`

How bounding box coordinates are interpreted [BoxFormat](../react-native-executorch/namespaces/cv/type-aliases/BoxFormat.md).

### defaultConfidenceThreshold

> `readonly` **defaultConfidenceThreshold**: `number`

Default minimum confidence score threshold for detected instances.

### defaultIouThreshold

> `readonly` **defaultIouThreshold**: `number`

Default Intersection over Union (IoU) threshold for Non-Maximum Suppression (NMS).

### defaultMaskThreshold

> `readonly` **defaultMaskThreshold**: `number`

Default probability threshold for mask values.

### labels

> `readonly` **labels**: readonly `L`[]

Array of class labels matching the model's output vocabulary.

### resizeMode

> `readonly` **resizeMode**: `"stretch"`

Resize mode for input images. Must be `'stretch'`.

## Type Parameters

### F

`F` _extends_ [`BoxFormat`](../react-native-executorch/namespaces/cv/type-aliases/BoxFormat.md)

The format type of the bounding box.

### L

`L`

The label type.
