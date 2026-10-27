# Type Alias: DetectKeypointsOptions

> **DetectKeypointsOptions** = `object`

Defined in: [extensions/cv/tasks/keypointDetection.ts:60](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L60)

Optional configuration parameters for keypoint detection inference.

## Properties

### confidenceThreshold?

> `readonly` `optional` **confidenceThreshold**: `number`

Defined in: [extensions/cv/tasks/keypointDetection.ts:65](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L65)

Minimum confidence score threshold for detections. If omitted, uses
[KeypointDetectorOptions.defaultConfidenceThreshold](KeypointDetectorOptions.md).

---

### iouThreshold?

> `readonly` `optional` **iouThreshold**: `number`

Defined in: [extensions/cv/tasks/keypointDetection.ts:70](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L70)

Intersection over Union (IoU) threshold for NMS. If omitted, uses
[KeypointDetectorOptions.defaultIouThreshold](KeypointDetectorOptions.md).
