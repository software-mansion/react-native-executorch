# Type Alias: DetectObjectsOptions

> **DetectObjectsOptions** = `object`

Defined in: [extensions/cv/tasks/objectDetection.ts:60](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts#L60)

Optional configuration parameters for object detection inference.

## Properties

### confidenceThreshold?

> `readonly` `optional` **confidenceThreshold**: `number`

Defined in: [extensions/cv/tasks/objectDetection.ts:65](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts#L65)

Minimum confidence score threshold. If omitted, uses
[ObjectDetectorOptions.defaultConfidenceThreshold](ObjectDetectorOptions.md).

---

### iouThreshold?

> `readonly` `optional` **iouThreshold**: `number`

Defined in: [extensions/cv/tasks/objectDetection.ts:70](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts#L70)

Intersection over Union (IoU) threshold for NMS. If omitted, uses
[ObjectDetectorOptions.defaultIouThreshold](ObjectDetectorOptions.md).
