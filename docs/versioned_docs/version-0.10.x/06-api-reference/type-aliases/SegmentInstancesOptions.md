# Type Alias: SegmentInstancesOptions

> **SegmentInstancesOptions** = `object`

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:74](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L74)

Optional configuration parameters for instance segmentation inference.

## Properties

### confidenceThreshold?

> `readonly` `optional` **confidenceThreshold**: `number`

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:79](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L79)

Minimum confidence threshold. If omitted, uses
[InstanceSegmenterOptions.defaultConfidenceThreshold](InstanceSegmenterOptions.md).

---

### iouThreshold?

> `readonly` `optional` **iouThreshold**: `number`

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:84](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L84)

Intersection over Union (IoU) threshold in NMS. If omitted, uses
[InstanceSegmenterOptions.defaultIouThreshold](InstanceSegmenterOptions.md).

---

### maskThreshold?

> `readonly` `optional` **maskThreshold**: `number`

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:89](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L89)

Mask binarization probability threshold. If omitted, uses
[InstanceSegmenterOptions.defaultMaskThreshold](InstanceSegmenterOptions.md).
