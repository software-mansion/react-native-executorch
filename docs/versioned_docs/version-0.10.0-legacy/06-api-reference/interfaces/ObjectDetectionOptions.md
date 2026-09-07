# Interface: ObjectDetectionOptions\<L\>

Defined in: [types/objectDetection.ts:44](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/objectDetection.ts#L44)

Options for configuring object detection inference.

## Type Parameters

### L

`L` _extends_ [`LabelEnum`](../type-aliases/LabelEnum.md)

The label enum type for filtering classes of interest.

## Properties

### classesOfInterest?

> `optional` **classesOfInterest**: keyof `L`[]

Defined in: [types/objectDetection.ts:48](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/objectDetection.ts#L48)

Optional array of class labels to filter detections. Only detections matching these classes will be returned.

---

### detectionThreshold?

> `optional` **detectionThreshold**: `number`

Defined in: [types/objectDetection.ts:45](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/objectDetection.ts#L45)

Minimum confidence score for detections (0-1). Defaults to model-specific value.

---

### inputSize?

> `optional` **inputSize**: `number`

Defined in: [types/objectDetection.ts:47](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/objectDetection.ts#L47)

Input size for multi-method models (e.g., 384, 512, 640 for YOLO). Required for YOLO models if not using default.

---

### iouThreshold?

> `optional` **iouThreshold**: `number`

Defined in: [types/objectDetection.ts:46](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/objectDetection.ts#L46)

IoU threshold for non-maximum suppression (0-1). Defaults to model-specific value.
