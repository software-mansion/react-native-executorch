# Interface: PoseEstimationOptions

Defined in: [types/poseEstimation.ts:90](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/poseEstimation.ts#L90)

Options for pose estimation inference

## Properties

### detectionThreshold?

> `optional` **detectionThreshold**: `number`

Defined in: [types/poseEstimation.ts:91](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/poseEstimation.ts#L91)

---

### inputSize?

> `optional` **inputSize**: `number`

Defined in: [types/poseEstimation.ts:103](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/poseEstimation.ts#L103)

Input size for multi-method models.
For YOLO models, valid values are typically 384, 512, or 640.
Maps to forward_384, forward_512, forward_640 methods.

---

### keypointThreshold?

> `optional` **keypointThreshold**: `number`

Defined in: [types/poseEstimation.ts:97](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/poseEstimation.ts#L97)

Per-keypoint visibility threshold (0-1). Keypoints whose visibility
score is below this are emitted as (-1, -1) so consumers can skip them.
Defaults to the model config's `defaultKeypointThreshold` (typically 0.5).
