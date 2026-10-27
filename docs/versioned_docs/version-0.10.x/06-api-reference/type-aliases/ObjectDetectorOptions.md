# Type Alias: ObjectDetectorOptions\<F, L\>

> **ObjectDetectorOptions**\<`F`, `L`\> = `Omit`\<[`ImagePreprocessorOptions`](../react-native-executorch/namespaces/cv/type-aliases/ImagePreprocessorOptions.md), `"resizeMode"`\> & `object`

Defined in: [extensions/cv/tasks/objectDetection.ts:25](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts#L25)

Options for configuring an object detector preprocessor, label vocabulary,
and detection thresholds.

## Type Declaration

### boxFormat

> `readonly` **boxFormat**: `F`

How bounding box coordinates are interpreted [BoxFormat](../react-native-executorch/namespaces/cv/type-aliases/BoxFormat.md).

### defaultConfidenceThreshold

> `readonly` **defaultConfidenceThreshold**: `number`

Default minimum confidence score threshold for detections.

### defaultIouThreshold

> `readonly` **defaultIouThreshold**: `number`

Default Intersection over Union (IoU) threshold for Non-Maximum Suppression (NMS).

### labels

> `readonly` **labels**: readonly `L`[]

Array of class labels matching the model's output vocabulary.

### resizeMode

> `readonly` **resizeMode**: `Exclude`\<[`ResizeMode`](../react-native-executorch/namespaces/cv/type-aliases/ResizeMode.md), `"crop"`\>

Resize mode for preprocessing input images (excluding `'crop'`).

## Type Parameters

### F

`F` _extends_ [`BoxFormat`](../react-native-executorch/namespaces/cv/type-aliases/BoxFormat.md)

### L

`L`
